# DAW 事件系統設計文檔

## 1. 事件系統概述

DAW 的事件系統分為兩個主要層次：

1. UI 事件層：處理用戶界面交互
2. Domain 事件層：處理業務邏輯

事件系統通過依賴注入（DI）進行整合，確保系統的鬆耦合性和可測試性。

### 1.1 DI 整合

事件系統的核心組件通過 DI 容器進行管理：

```typescript
// types.ts
export const TYPES = {
    EventBus: Symbol.for('EventBus'),
    EventLogService: Symbol.for('EventLogService'),
    EventFilterChain: Symbol.for('EventFilterChain')
};

export interface IEventBus<T extends Record<string, any>> {
    emit<K extends keyof T>(event: K, payload: T[K]): void;
    emitAsync<K extends keyof T>(event: K, payload: T[K]): Promise<void>;
    on<K extends keyof T>(
        event: K,
        handler: (payload: T[K]) => void | Promise<void>,
        options?: EventHandlerOptions
    ): void;
    off<K extends keyof T>(event: K, handler: (payload: T[K]) => void): void;
    once<K extends keyof T>(
        event: K,
        handler: (payload: T[K]) => void | Promise<void>,
        options?: EventHandlerOptions
    ): void;
    setDebugMode(enabled: boolean): void;
    addFilter<K extends keyof T>(event: K, filter: EventFilter<T[K]>): void;
}
```

### 1.2 服務註冊

事件系統的服務在 DI 容器中註冊：

```typescript
// container.ts
container.bind<IEventBus<EventMap>>(TYPES.EventBus).to(EventBus).inSingletonScope();
container.bind<EventLogService>(TYPES.EventLogService).to(EventLogService).inSingletonScope();
container.bind<EventFilterChain>(TYPES.EventFilterChain).to(EventFilterChain).inSingletonScope();
```

## 2. 事件類型定義

### 2.1 事件優先級

```typescript
export enum EventPriority {
    HIGH = 0,
    MEDIUM = 1,
    LOW = 2
}

export interface EventHandler<T> {
    handler: (payload: T) => void | Promise<void>;
    priority: EventPriority;
    retryConfig?: RetryConfig;
}

export interface RetryConfig {
    maxAttempts: number;
    delay: number;
    backoff: number;
}
```

### 2.2 事件過濾器

```typescript
export interface EventFilter<T> {
    shouldProcess(payload: T): boolean;
}

export class EventFilterChain<T> {
    private filters: EventFilter<T>[] = [];
    
    addFilter(filter: EventFilter<T>): void {
        this.filters.push(filter);
    }
    
    shouldProcess(payload: T): boolean {
        return this.filters.every(filter => filter.shouldProcess(payload));
    }
}
```

### 2.3 事件系統核心接口

```typescript
export interface EventBus<T extends Record<string, any>> {
    emit<K extends keyof T>(event: K, payload: T[K]): void;
    emitAsync<K extends keyof T>(event: K, payload: T[K]): Promise<void>;
    on<K extends keyof T>(
        event: K,
        handler: (payload: T[K]) => void | Promise<void>,
        options?: EventHandlerOptions
    ): void;
    off<K extends keyof T>(event: K, handler: (payload: T[K]) => void): void;
    once<K extends keyof T>(
        event: K,
        handler: (payload: T[K]) => void | Promise<void>,
        options?: EventHandlerOptions
    ): void;
    setDebugMode(enabled: boolean): void;
    addFilter<K extends keyof T>(event: K, filter: EventFilter<T[K]>): void;
}

export interface EventHandlerOptions {
    priority?: EventPriority;
    retryConfig?: RetryConfig;
}
```

### 2.4 事件日誌服務

```typescript
export interface EventLogEntry {
    type: 'ui' | 'domain';
    event: string;
    timestamp: number;
    payload: any;
    priority: EventPriority;
    processingTime?: number;
    error?: Error;
}

export class EventLogService {
    private logs: EventLogEntry[] = [];
    private maxLogSize: number = 1000;
    
    log(entry: EventLogEntry): void {
        this.logs.push(entry);
        if (this.logs.length > this.maxLogSize) {
            this.logs.shift();
        }
    }
    
    getLogs(filter?: EventLogFilter): EventLogEntry[] {
        if (!filter) return this.logs;
        return this.logs.filter(entry => this.matchesFilter(entry, filter));
    }
    
    clear(): void {
        this.logs = [];
    }
    
    private matchesFilter(entry: EventLogEntry, filter: EventLogFilter): boolean {
        return (
            (!filter.type || entry.type === filter.type) &&
            (!filter.event || entry.event === filter.event) &&
            (!filter.priority || entry.priority === filter.priority) &&
            (!filter.startTime || entry.timestamp >= filter.startTime) &&
            (!filter.endTime || entry.timestamp <= filter.endTime)
        );
    }
}
```

### 2.5 通用事件總線工廠

```typescript
export function createEventBus<T extends Record<string, any>>(
    label: string,
    eventLogService?: EventLogService,
    debug = false
): EventBus<T> {
    const emitter = new EventEmitter();
    const handlers = new Map<string, Set<EventHandler<any>>>();
    const filters = new Map<string, EventFilterChain<any>>();
    
    return {
        emit<K extends keyof T>(event: K, payload: T[K]): void {
            const eventName = String(event);
            const filterChain = filters.get(eventName);
            
            if (filterChain && !filterChain.shouldProcess(payload)) {
                return;
            }
            
            if (debug) {
                console.debug(`[${label}] ${eventName}:`, payload);
            }
            
            const eventHandlers = handlers.get(eventName) || new Set();
            const sortedHandlers = Array.from(eventHandlers).sort(
                (a, b) => a.priority - b.priority
            );
            
            for (const { handler, retryConfig } of sortedHandlers) {
                if (retryConfig) {
                    this.executeWithRetry(handler, payload, retryConfig);
                } else {
                    try {
                        handler(payload);
                    } catch (error) {
                        console.error(`Error handling event ${eventName}:`, error);
                    }
                }
            }
            
            if (eventLogService) {
                eventLogService.log({
                    type: label.toLowerCase().includes('ui') ? 'ui' : 'domain',
                    event: eventName,
                    payload,
                    timestamp: Date.now(),
                    priority: EventPriority.MEDIUM
                });
            }
        },
        
        async emitAsync<K extends keyof T>(event: K, payload: T[K]): Promise<void> {
            const eventName = String(event);
            const filterChain = filters.get(eventName);
            
            if (filterChain && !filterChain.shouldProcess(payload)) {
                return;
            }
            
            const eventHandlers = handlers.get(eventName) || new Set();
            const sortedHandlers = Array.from(eventHandlers).sort(
                (a, b) => a.priority - b.priority
            );
            
            const promises = sortedHandlers.map(({ handler, retryConfig }) => {
                if (retryConfig) {
                    return this.executeWithRetryAsync(handler, payload, retryConfig);
                }
                return Promise.resolve(handler(payload));
            });
            
            await Promise.all(promises);
        },
        
        on<K extends keyof T>(
            event: K,
            handler: (payload: T[K]) => void | Promise<void>,
            options: EventHandlerOptions = {}
        ): void {
            const eventName = String(event);
            if (!handlers.has(eventName)) {
                handlers.set(eventName, new Set());
            }
            
            handlers.get(eventName)!.add({
                handler,
                priority: options.priority || EventPriority.MEDIUM,
                retryConfig: options.retryConfig
            });
        },
        
        off<K extends keyof T>(event: K, handler: (payload: T[K]) => void): void {
            const eventName = String(event);
            const eventHandlers = handlers.get(eventName);
            if (eventHandlers) {
                eventHandlers.delete(handler);
            }
        },
        
        once<K extends keyof T>(
            event: K,
            handler: (payload: T[K]) => void | Promise<void>,
            options: EventHandlerOptions = {}
        ): void {
            const onceHandler = (payload: T[K]) => {
                handler(payload);
                this.off(event, onceHandler);
            };
            this.on(event, onceHandler, options);
        },
        
        setDebugMode(enabled: boolean): void {
            debug = enabled;
        },
        
        addFilter<K extends keyof T>(event: K, filter: EventFilter<T[K]>): void {
            const eventName = String(event);
            if (!filters.has(eventName)) {
                filters.set(eventName, new EventFilterChain());
            }
            filters.get(eventName)!.addFilter(filter);
        }
    };
}

// 重試執行器
async function executeWithRetry<T>(
    handler: (payload: T) => void,
    payload: T,
    config: RetryConfig
): Promise<void> {
    let attempts = 0;
    let delay = config.delay;
    
    while (attempts < config.maxAttempts) {
        try {
            handler(payload);
            return;
        } catch (error) {
            attempts++;
            if (attempts === config.maxAttempts) {
                throw error;
            }
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= config.backoff;
        }
    }
}

// 異步重試執行器
async function executeWithRetryAsync<T>(
    handler: (payload: T) => Promise<void>,
    payload: T,
    config: RetryConfig
): Promise<void> {
    let attempts = 0;
    let delay = config.delay;
    
    while (attempts < config.maxAttempts) {
        try {
            await handler(payload);
            return;
        } catch (error) {
            attempts++;
            if (attempts === config.maxAttempts) {
                throw error;
            }
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= config.backoff;
        }
    }
}
```

### 2.6 UI 事件總線

```typescript
export class UIEventBus {
    private eventBus = createEventBus<UIEventPayload>('UIEvent', undefined, false);
    
    emit<K extends keyof UIEventPayload>(
        event: K,
        payload: UIEventPayload[K]
    ): void {
        this.eventBus.emit(event, payload);
    }
    
    emitAsync<K extends keyof UIEventPayload>(
        event: K,
        payload: UIEventPayload[K]
    ): Promise<void> {
        return this.eventBus.emitAsync(event, payload);
    }
    
    on<K extends keyof UIEventPayload>(
        event: K,
        handler: (payload: UIEventPayload[K]) => void
    ): void {
        this.eventBus.on(event, handler);
    }
    
    off<K extends keyof UIEventPayload>(
        event: K,
        handler: (payload: UIEventPayload[K]) => void
    ): void {
        this.eventBus.off(event, handler);
    }
    
    once<K extends keyof UIEventPayload>(
        event: K,
        handler: (payload: UIEventPayload[K]) => void
    ): void {
        this.eventBus.once(event, handler);
    }
    
    setDebugMode(enabled: boolean): void {
        this.eventBus.setDebugMode(enabled);
    }
}
```

### 2.7 Domain 事件總線

```typescript
export class DomainEventBus {
    private eventBus = createEventBus<DomainEventPayload>('DomainEvent', undefined, false);
    
    emit<K extends keyof DomainEventPayload>(
        event: K,
        payload: DomainEventPayload[K]
    ): void {
        this.eventBus.emit(event, payload);
    }
    
    emitAsync<K extends keyof DomainEventPayload>(
        event: K,
        payload: DomainEventPayload[K]
    ): Promise<void> {
        return this.eventBus.emitAsync(event, payload);
    }
    
    on<K extends keyof DomainEventPayload>(
        event: K,
        handler: (payload: DomainEventPayload[K]) => void
    ): void {
        this.eventBus.on(event, handler);
    }
    
    off<K extends keyof DomainEventPayload>(
        event: K,
        handler: (payload: DomainEventPayload[K]) => void
    ): void {
        this.eventBus.off(event, handler);
    }
    
    once<K extends keyof DomainEventPayload>(
        event: K,
        handler: (payload: DomainEventPayload[K]) => void
    ): void {
        this.eventBus.once(event, handler);
    }
    
    setDebugMode(enabled: boolean): void {
        this.eventBus.setDebugMode(enabled);
    }
}
```

## 3. 事件轉譯器

### 3.1 事件轉譯器介面

```typescript
export interface EventTranslator {
    initialize(): void;
    destroy(): void;
}
```

### 3.2 模組化事件轉譯器

```typescript
// 播放控制事件轉譯器
class PlaybackEventTranslator implements EventTranslator {
    constructor(
        private uiEventBus: UIEventBus,
        private domainEventBus: DomainEventBus
    ) {}
    
    initialize(): void {
        this.setupTranslations();
    }
    
    destroy(): void {
        // 清理事件監聽器
    }
    
    private setupTranslations(): void {
        // UI -> Domain
        this.uiEventBus.on('ui:playback:start', () => {
            this.domainEventBus.emit('domain:audio:playback:started', undefined);
        });
        
        // Domain -> UI
        this.domainEventBus.on('domain:audio:playback:started', () => {
            this.uiEventBus.emit('ui:playback:start', undefined);
        });
    }
}

// 軌道事件轉譯器
class TrackEventTranslator implements EventTranslator {
    constructor(
        private uiEventBus: UIEventBus,
        private domainEventBus: DomainEventBus
    ) {}
    
    initialize(): void {
        this.setupTranslations();
    }
    
    destroy(): void {
        // 清理事件監聽器
    }
    
    private setupTranslations(): void {
        // UI -> Domain
        this.uiEventBus.on('ui:track:add', (payload) => {
            this.domainEventBus.emit('domain:track:added', {
                track: this.createTrackFromPayload(payload)
            });
        });
        
        // Domain -> UI
        this.domainEventBus.on('domain:track:added', (payload) => {
            this.uiEventBus.emit('ui:track:add', {
                trackId: payload.track.id,
                type: payload.track.type
            });
        });
    }
    
    private createTrackFromPayload(payload: any): Track {
        return new Track({
            id: payload.trackId,
            type: payload.type,
            name: 'New Track',
            volume: 1,
            pan: 0,
            muted: false,
            soloed: false,
            color: '#000000',
            clips: [],
            effects: [],
            automation: []
        });
    }
}

// 片段事件轉譯器
class ClipEventTranslator implements EventTranslator {
    constructor(
        private uiEventBus: UIEventBus,
        private domainEventBus: DomainEventBus
    ) {}
    
    initialize(): void {
        this.setupTranslations();
    }
    
    destroy(): void {
        // 清理事件監聽器
    }
    
    private setupTranslations(): void {
        // UI -> Domain
        this.uiEventBus.on('ui:clip:move', (payload) => {
            this.domainEventBus.emit('domain:clip:moved', {
                clipId: payload.clipId,
                newStartTime: payload.newPosition
            });
        });
        
        // Domain -> UI
        this.domainEventBus.on('domain:clip:moved', (payload) => {
            this.uiEventBus.emit('ui:clip:move', {
                clipId: payload.clipId,
                newPosition: payload.newStartTime
            });
        });
    }
}
```

### 3.3 事件轉譯器實現

```typescript
export class EventTranslatorImpl implements EventTranslator {
    private translators: EventTranslator[] = [];
    
    constructor(
        private uiEventBus: UIEventBus,
        private domainEventBus: DomainEventBus
    ) {}
    
    initialize(): void {
        this.translators = [
            new PlaybackEventTranslator(this.uiEventBus, this.domainEventBus),
            new TrackEventTranslator(this.uiEventBus, this.domainEventBus),
            new ClipEventTranslator(this.uiEventBus, this.domainEventBus)
        ];
        
        this.translators.forEach(translator => translator.initialize());
    }
    
    destroy(): void {
        this.translators.forEach(translator => translator.destroy());
        this.translators = [];
    }
}
```

## 4. 事件系統測試

### 4.1 事件轉譯器測試

```typescript
describe('EventTranslator', () => {
    let uiEventBus: UIEventBus;
    let domainEventBus: DomainEventBus;
    let translator: EventTranslatorImpl;
    
    beforeEach(() => {
        uiEventBus = new UIEventBus();
        domainEventBus = new DomainEventBus();
        translator = new EventTranslatorImpl(uiEventBus, domainEventBus);
        translator.initialize();
    });
    
    afterEach(() => {
        translator.destroy();
    });
    
    describe('Playback Events', () => {
        it('should translate UI playback start to domain event', async () => {
            const promise = new Promise<void>(resolve => {
                domainEventBus.on('domain:audio:playback:started', () => {
                    resolve();
                });
            });
            
            uiEventBus.emit('ui:playback:start', undefined);
            await promise;
        });
    });
    
    describe('Track Events', () => {
        it('should translate UI track add to domain event', async () => {
            const trackId = 'track-1';
            const trackType = TrackType.AUDIO;
            
            const promise = new Promise<void>(resolve => {
                domainEventBus.on('domain:track:added', (payload) => {
                    expect(payload.track.id).toBe(trackId);
                    expect(payload.track.type).toBe(trackType);
                    resolve();
                });
            });
            
            uiEventBus.emit('ui:track:add', {
                trackId,
                type: trackType
            });
            
            await promise;
        });
    });
});
```

## 5. 最佳實踐

1. **事件命名規範**
   - UI 事件使用 `ui:` 前綴
   - Domain 事件使用 `domain:` 前綴
   - 事件名稱使用動詞-名詞格式
   - 事件名稱使用小寫字母和冒號分隔

2. **事件處理原則**
   - UI 事件只處理視覺反饋
   - Domain 事件處理業務邏輯
   - 使用事件轉換器連接兩層
   - 避免在事件處理器中執行耗時操作

3. **類型安全**
   - 使用 TypeScript 接口定義事件類型
   - 確保事件處理器類型正確
   - 使用泛型約束事件類型
   - 使用 `emitAsync` 處理異步事件

4. **性能考慮**
   - 避免過多的事件監聽
   - 及時移除不需要的事件監聽器
   - 使用防抖和節流處理頻繁事件
   - 使用事件委託減少監聽器數量

5. **錯誤處理**
   - 在事件處理器中捕獲並處理錯誤
   - 提供錯誤事件類型
   - 記錄錯誤日誌
   - 實現錯誤恢復機制

6. **調試支持**
   - 提供調試模式
   - 記錄事件日誌
   - 支持事件追蹤
   - 提供性能分析工具

7. **測試策略**
   - 為每個事件轉譯器編寫單元測試
   - 測試事件轉換的正確性
   - 模擬事件流進行集成測試
   - 確保事件清理機制正常工作

# 事件系統使用指南

## 概述

本專案實現了一個雙層事件系統，包括：
- UI 事件總線：處理用戶界面相關的事件
- 領域事件總線：處理業務邏輯相關的事件

## 事件類型

### UI 事件

```typescript
export interface UIEventPayload {
  // 片段相關事件
  'ui:clip:add': {
    trackId: string;
    position: number;
    duration: number;
    audioUrl: string;
  };
  'ui:clip:move': {
    clipId: string;
    newPosition: number;
    trackId: string;
  };
  'ui:clip:delete': {
    clipId: string;
  };

  // 播放控制事件
  'ui:playback:start': void;
  'ui:playback:pause': void;
  'ui:playback:stop': void;
  'ui:bpm:change': {
    bpm: number;
  };
}
```

### 領域事件

```typescript
export interface DomainEventPayload {
  // 片段相關事件
  'domain:clip:added': {
    clip: ClipViewModel;
  };
  'domain:clip:moved': {
    clipId: string;
    newStartTime: number;
    trackId: string;
  };
  'domain:clip:deleted': {
    clipId: string;
  };

  // 播放狀態事件
  'domain:playback:started': {
    time: number;
  };
  'domain:playback:paused': {
    time: number;
  };
  'domain:playback:stopped': {
    time: number;
  };
  'domain:bpm:changed': {
    bpm: number;
  };
}
```

## 使用方式

### 1. 在 React 組件中使用

```typescript
const TrackComponent: React.FC<{ trackId: string }> = ({ trackId }) => {
  const uiEventBus = container.get<UIEventBus>(TYPES.UIEventBus);
  const [clips, setClips] = useState<ClipViewModel[]>([]);

  useEffect(() => {
    // 監聽片段添加事件
    const handleClipAdded = (event: DomainEventPayload['domain:clip:added']) => {
      setClips(prev => [...prev, event.clip]);
    };

    const domainEventBus = container.get<DomainEventBus>(TYPES.DomainEventBus);
    domainEventBus.on('domain:clip:added', handleClipAdded);

    return () => {
      domainEventBus.off('domain:clip:added', handleClipAdded);
    };
  }, []);

  const handleAddClip = () => {
    uiEventBus.emit('ui:clip:add', {
      trackId,
      position: 0,
      duration: 4,
      audioUrl: 'path/to/audio.mp3'
    });
  };

  return (
    <div>
      <button onClick={handleAddClip}>添加片段</button>
      {clips.map(clip => (
        <ClipView key={clip.id} clip={clip} />
      ))}
    </div>
  );
};
```

### 2. 在服務中使用

```typescript
@injectable()
class AudioService {
  constructor(
    @inject(TYPES.UIEventBus) private uiEventBus: UIEventBus,
    @inject(TYPES.DomainEventBus) private domainEventBus: DomainEventBus,
    @inject(TYPES.AudioEngine) private audioEngine: AudioEngine
  ) {
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    // 監聽 UI 事件
    this.uiEventBus.on('ui:playback:start', () => {
      this.audioEngine.play();
      this.domainEventBus.emit('domain:playback:started', {
        time: this.audioEngine.getCurrentTime()
      });
    });

    this.uiEventBus.on('ui:bpm:change', ({ bpm }) => {
      this.audioEngine.setBPM(bpm);
      this.domainEventBus.emit('domain:bpm:changed', { bpm });
    });
  }
}
```

### 3. 使用事件轉換器

```typescript
@injectable()
class EventTranslator {
  constructor(
    @inject(TYPES.UIEventBus) private uiEventBus: UIEventBus,
    @inject(TYPES.DomainEventBus) private domainEventBus: DomainEventBus
  ) {
    this.setupTranslations();
  }

  private setupTranslations() {
    // UI -> Domain 事件轉換
    this.uiEventBus.on('ui:clip:add', async (payload) => {
      const clip = await this.createClip(payload);
      this.domainEventBus.emit('domain:clip:added', { clip });
    });

    // Domain -> UI 事件轉換
    this.domainEventBus.on('domain:playback:started', (payload) => {
      this.updateUIPlaybackState(payload.time);
    });
  }
}
```

## 最佳實踐

### 1. 事件命名規範

```typescript
// UI 事件：ui:模塊:動作
'ui:clip:add'
'ui:playback:start'

// 領域事件：domain:模塊:動作
'domain:clip:added'
'domain:playback:started'
```

### 2. 類型安全的事件處理

```typescript
// 定義事件處理器類型
type ClipAddedHandler = (event: DomainEventPayload['domain:clip:added']) => void;

// 使用類型安全的事件處理
const handleClipAdded: ClipAddedHandler = (event) => {
  // event.clip 已經被正確類型推斷
  console.log(event.clip.id);
};
```

### 3. 事件清理

```typescript
class MyComponent extends React.Component {
  private eventSubscriptions: (() => void)[] = [];

  componentDidMount() {
    const domainEventBus = container.get<DomainEventBus>(TYPES.DomainEventBus);
    
    // 保存取消訂閱函數
    this.eventSubscriptions.push(
      domainEventBus.on('domain:clip:added', this.handleClipAdded),
      domainEventBus.on('domain:playback:started', this.handlePlaybackStarted)
    );
  }

  componentWillUnmount() {
    // 清理所有事件訂閱
    this.eventSubscriptions.forEach(unsubscribe => unsubscribe());
  }
}
```

### 4. 錯誤處理

```typescript
@injectable()
class ErrorHandler {
  constructor(
    @inject(TYPES.DomainEventBus) private domainEventBus: DomainEventBus
  ) {
    this.setupErrorHandling();
  }

  private setupErrorHandling() {
    this.domainEventBus.onError((error, eventName) => {
      console.error(`Error handling event ${eventName}:`, error);
      // 可以發送錯誤到監控系統
    });
  }
}
```

## 調試技巧

### 1. 事件日誌

```typescript
// 開啟事件日誌
uiEventBus.enableLogging();
domainEventBus.enableLogging();

// 自定義日誌處理
uiEventBus.setLogger((eventName, payload) => {
  console.log(`[UI Event] ${eventName}:`, payload);
});
```

### 2. 事件追蹤

```typescript
@injectable()
class EventTracer {
  private eventHistory: Array<{
    timestamp: number;
    bus: 'ui' | 'domain';
    event: string;
    payload: any;
  }> = [];

  constructor(
    @inject(TYPES.UIEventBus) uiEventBus: UIEventBus,
    @inject(TYPES.DomainEventBus) domainEventBus: DomainEventBus
  ) {
    this.setupTracing(uiEventBus, 'ui');
    this.setupTracing(domainEventBus, 'domain');
  }

  private setupTracing(eventBus: UIEventBus | DomainEventBus, type: 'ui' | 'domain') {
    eventBus.onAny((eventName, payload) => {
      this.eventHistory.push({
        timestamp: Date.now(),
        bus: type,
        event: eventName,
        payload
      });
    });
  }

  public getEventHistory() {
    return this.eventHistory;
  }
}
```

## 效能考慮

### 1. 事件批處理

```typescript
@injectable()
class BatchEventProcessor {
  private batchTimeout: number = 16; // ~1 幀
  private pendingEvents: Array<{
    name: string;
    payload: any;
  }> = [];

  constructor(
    @inject(TYPES.DomainEventBus) private domainEventBus: DomainEventBus
  ) {}

  public queueEvent(name: string, payload: any) {
    this.pendingEvents.push({ name, payload });
    this.scheduleBatchProcess();
  }

  private scheduleBatchProcess() {
    setTimeout(() => {
      const events = [...this.pendingEvents];
      this.pendingEvents = [];
      
      events.forEach(event => {
        this.domainEventBus.emit(event.name, event.payload);
      });
    }, this.batchTimeout);
  }
}
```

### 2. 事件過濾

```typescript
@injectable()
class EventFilter {
  constructor(
    @inject(TYPES.DomainEventBus) private domainEventBus: DomainEventBus
  ) {}

  public addFilter<T extends keyof DomainEventPayload>(
    eventName: T,
    filter: (payload: DomainEventPayload[T]) => boolean
  ) {
    const originalEmit = this.domainEventBus.emit;
    
    this.domainEventBus.emit = (name: T, payload: DomainEventPayload[T]) => {
      if (name === eventName && !filter(payload)) {
        return;
      }
      originalEmit.call(this.domainEventBus, name, payload);
    };
  }
}
```

## 測試

### 1. 模擬事件總線

```typescript
class MockEventBus implements IEventBus {
  private handlers: Map<string, Function[]> = new Map();
  private emittedEvents: Array<{ name: string; payload: any }> = [];

  on(eventName: string, handler: Function) {
    const handlers = this.handlers.get(eventName) || [];
    handlers.push(handler);
    this.handlers.set(eventName, handlers);
  }

  emit(eventName: string, payload: any) {
    this.emittedEvents.push({ name: eventName, payload });
    const handlers = this.handlers.get(eventName) || [];
    handlers.forEach(handler => handler(payload));
  }

  getEmittedEvents() {
    return this.emittedEvents;
  }
}

// 在測試中使用
describe('AudioService', () => {
  let mockUiEventBus: MockEventBus;
  let mockDomainEventBus: MockEventBus;
  let audioService: AudioService;

  beforeEach(() => {
    mockUiEventBus = new MockEventBus();
    mockDomainEventBus = new MockEventBus();
    
    audioService = new AudioService(
      mockUiEventBus,
      mockDomainEventBus,
      mockAudioEngine
    );
  });

  it('should emit domain event when UI event received', () => {
    mockUiEventBus.emit('ui:playback:start', undefined);
    
    const emittedEvents = mockDomainEventBus.getEmittedEvents();
    expect(emittedEvents[0].name).toBe('domain:playback:started');
  });
});
```

## 擴展

### 1. 添加新事件類型

1. 在事件類型定義中添加新事件：
```typescript
export interface UIEventPayload {
  // 添加新的 UI 事件
  'ui:newFeature:action': {
    // 事件參數
  };
}

export interface DomainEventPayload {
  // 添加新的領域事件
  'domain:newFeature:happened': {
    // 事件參數
  };
}
```

2. 實現事件處理：
```typescript
@injectable()
class NewFeatureHandler {
  constructor(
    @inject(TYPES.UIEventBus) private uiEventBus: UIEventBus,
    @inject(TYPES.DomainEventBus) private domainEventBus: DomainEventBus
  ) {
    this.setupHandlers();
  }

  private setupHandlers() {
    this.uiEventBus.on('ui:newFeature:action', this.handleNewFeatureAction);
  }

  private handleNewFeatureAction = (payload: UIEventPayload['ui:newFeature:action']) => {
    // 處理邏輯
  };
}
```

### 2. 添加事件中間件

```typescript
@injectable()
class EventMiddleware {
  constructor(
    @inject(TYPES.DomainEventBus) private domainEventBus: DomainEventBus
  ) {}

  public addMiddleware(
    middleware: (eventName: string, payload: any, next: () => void) => void
  ) {
    const originalEmit = this.domainEventBus.emit;
    
    this.domainEventBus.emit = (name: string, payload: any) => {
      middleware(name, payload, () => {
        originalEmit.call(this.domainEventBus, name, payload);
      });
    };
  }
}

// 使用中間件
const middleware = new EventMiddleware(domainEventBus);

// 添加日誌中間件
middleware.addMiddleware((name, payload, next) => {
  console.log(`[Event] ${name}:`, payload);
  next();
});

// 添加驗證中間件
middleware.addMiddleware((name, payload, next) => {
  if (validatePayload(name, payload)) {
    next();
  } else {
    console.error(`Invalid payload for event ${name}`);
  }
});
```

## 參考資料

- [Event Emitter Pattern](https://en.wikipedia.org/wiki/Observer_pattern)
- [TypeScript Event Handling](https://www.typescriptlang.org/docs/handbook/decorators.html)
- [React Event Handling](https://reactjs.org/docs/handling-events.html)
