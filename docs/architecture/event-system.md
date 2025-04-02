# 事件系統設計

## 概述

本系統採用事件驅動架構，通過事件系統實現各層級之間的解耦和通信。事件系統分為 UI 事件和領域事件兩大類，確保了清晰的職責分離和數據流向。

## 事件類型

### 1. UI 事件

```typescript
interface UIEventPayload {
    // 軌道相關事件
    'ui:track:create': void;
    'ui:track:delete': { trackId: string };
    'ui:track:volume': { trackId: string; volume: number };
    'ui:track:pan': { trackId: string; pan: number };
    'ui:track:mute': { trackId: string };
    'ui:track:solo': { trackId: string };
    
    // 片段相關事件
    'ui:clip:add': { trackId: string; audioUrl: string };
    'ui:clip:delete': { clipId: string };
    'ui:clip:move': { clipId: string; newPosition: number };
    'ui:clip:resize': { clipId: string; newDuration: number };
    
    // 播放控制事件
    'ui:transport:play': void;
    'ui:transport:pause': void;
    'ui:transport:stop': void;
    'ui:transport:record': void;
    'ui:transport:bpm:change': { bpm: number };
    
    // 時間軸事件
    'ui:timeline:seek': { position: number };
    'ui:timeline:zoom': { zoom: number };
}
```

### 2. 領域事件

```typescript
interface DomainEventPayload {
    // 軌道領域事件
    'domain:track:created': { track: Track };
    'domain:track:deleted': { trackId: string };
    'domain:track:updated': { track: Track };
    'domain:track:added': { track: Track };
    
    // 片段領域事件
    'domain:clip:created': { clip: Clip };
    'domain:clip:deleted': { clipId: string };
    'domain:clip:moved': { clipId: string; newStartTime: number };
    'domain:clip:resized': { clipId: string; newDuration: number };
    
    // 播放控制領域事件
    'domain:transport:state:changed': { state: 'playing' | 'paused' | 'stopped' };
    'domain:transport:bpm:changed': { bpm: number };
    
    // 音頻領域事件
    'domain:audio:context:initialized': { sampleRate: number };
    'domain:audio:buffer:underrun': void;
    'domain:audio:buffer:overrun': void;
}
```

## 事件總線

### 1. 事件總線接口

```typescript
interface EventBus {
    on<T extends keyof UIEventPayload | keyof DomainEventPayload>(
        event: T,
        handler: (payload: UIEventPayload[T] | DomainEventPayload[T]) => void
    ): void;
    
    off<T extends keyof UIEventPayload | keyof DomainEventPayload>(
        event: T,
        handler: (payload: UIEventPayload[T] | DomainEventPayload[T]) => void
    ): void;
    
    emit<T extends keyof UIEventPayload | keyof DomainEventPayload>(
        event: T,
        payload: UIEventPayload[T] | DomainEventPayload[T]
    ): void;
}
```

### 2. 事件總線實現

```typescript
@injectable()
class EventBusImpl implements EventBus {
    private handlers: Map<string, Set<Function>> = new Map();
    
    on<T extends keyof UIEventPayload | keyof DomainEventPayload>(
        event: T,
        handler: (payload: UIEventPayload[T] | DomainEventPayload[T]) => void
    ): void {
        if (!this.handlers.has(event)) {
            this.handlers.set(event, new Set());
        }
        this.handlers.get(event)!.add(handler);
    }
    
    off<T extends keyof UIEventPayload | keyof DomainEventPayload>(
        event: T,
        handler: (payload: UIEventPayload[T] | DomainEventPayload[T]) => void
    ): void {
        const handlers = this.handlers.get(event);
        if (handlers) {
            handlers.delete(handler);
        }
    }
    
    emit<T extends keyof UIEventPayload | keyof DomainEventPayload>(
        event: T,
        payload: UIEventPayload[T] | DomainEventPayload[T]
    ): void {
        const handlers = this.handlers.get(event);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(payload);
                } catch (error) {
                    console.error(`Error handling event ${event}:`, error);
                }
            });
        }
    }
}
```

## 事件處理

### 1. UI 事件處理

```typescript
class TrackComponent {
    constructor(
        @inject(TYPES.UIEventBus)
        private uiEventBus: EventBus,
        @inject(TYPES.StateManager)
        private stateManager: StateManager
    ) {
        this.setupEventHandlers();
    }
    
    private setupEventHandlers(): void {
        // 處理軌道事件
        this.uiEventBus.on('ui:track:volume', this.handleTrackVolume);
        this.uiEventBus.on('ui:track:pan', this.handleTrackPan);
        this.uiEventBus.on('ui:track:mute', this.handleTrackMute);
        this.uiEventBus.on('ui:track:solo', this.handleTrackSolo);
    }
    
    private handleTrackVolume = (payload: UIEventPayload['ui:track:volume']): void => {
        this.stateManager.updateState(state => ({
            tracks: state.tracks.map(track =>
                track.id === payload.trackId
                    ? { ...track, volume: payload.volume }
                    : track
            )
        }));
    };
}
```

### 2. 領域事件處理

```typescript
class TrackService {
    constructor(
        @inject(TYPES.DomainEventBus)
        private domainEventBus: EventBus,
        @inject(TYPES.TrackRepository)
        private trackRepository: TrackRepository
    ) {
        this.setupEventHandlers();
    }
    
    private setupEventHandlers(): void {
        // 處理軌道領域事件
        this.domainEventBus.on('domain:track:created', this.handleTrackCreated);
        this.domainEventBus.on('domain:track:updated', this.handleTrackUpdated);
        this.domainEventBus.on('domain:track:deleted', this.handleTrackDeleted);
    }
    
    private handleTrackCreated = async (payload: DomainEventPayload['domain:track:created']): Promise<void> => {
        await this.trackRepository.save(payload.track);
    };
}
```

## 事件轉換

### 1. 事件轉換器

```typescript
@injectable()
class EventTranslator {
    constructor(
        @inject(TYPES.UIEventBus)
        private uiEventBus: EventBus,
        @inject(TYPES.DomainEventBus)
        private domainEventBus: EventBus
    ) {
        this.setupTranslations();
    }
    
    private setupTranslations(): void {
        // UI -> Domain 事件轉換
        this.setupUIToDomainTranslations();
        
        // Domain -> UI 事件轉換
        this.setupDomainToUITranslations();
    }
    
    private setupUIToDomainTranslations(): void {
        // 軌道事件轉換
        this.uiEventBus.on('ui:track:create', () => {
            const track = new Track();
            this.domainEventBus.emit('domain:track:created', { track });
        });
        
        // 播放控制事件轉換
        this.uiEventBus.on('ui:transport:play', () => {
            this.domainEventBus.emit('domain:transport:state:changed', {
                state: 'playing'
            });
        });
    }
    
    private setupDomainToUITranslations(): void {
        // 軌道事件轉換
        this.domainEventBus.on('domain:track:created', (payload) => {
            this.uiEventBus.emit('ui:track:added', {
                track: payload.track
            });
        });
        
        // 播放控制事件轉換
        this.domainEventBus.on('domain:transport:state:changed', (payload) => {
            switch (payload.state) {
                case 'playing':
                    this.uiEventBus.emit('ui:transport:play');
                    break;
                case 'paused':
                    this.uiEventBus.emit('ui:transport:pause');
                    break;
                case 'stopped':
                    this.uiEventBus.emit('ui:transport:stop');
                    break;
            }
        });
    }
}
```

## 事件監控

### 1. 事件日誌

```typescript
@injectable()
class EventLogger {
    constructor(
        @inject(TYPES.UIEventBus)
        private uiEventBus: EventBus,
        @inject(TYPES.DomainEventBus)
        private domainEventBus: EventBus
    ) {
        this.setupLogging();
    }
    
    private setupLogging(): void {
        // 監控 UI 事件
        this.uiEventBus.on('*', this.logUIEvent);
        
        // 監控領域事件
        this.domainEventBus.on('*', this.logDomainEvent);
    }
    
    private logUIEvent = (event: string, payload: any): void => {
        console.log('[UI Event]', {
            timestamp: new Date(),
            event,
            payload: this.sanitizePayload(payload)
        });
    };
    
    private logDomainEvent = (event: string, payload: any): void => {
        console.log('[Domain Event]', {
            timestamp: new Date(),
            event,
            payload: this.sanitizePayload(payload)
        });
    };
    
    private sanitizePayload(payload: any): any {
        // 移除敏感信息
        return JSON.parse(JSON.stringify(payload));
    }
}
```

### 2. 性能監控

```typescript
@injectable()
class EventPerformanceMonitor {
    private eventTimes: Map<string, number[]> = new Map();
    
    constructor(
        @inject(TYPES.UIEventBus)
        private uiEventBus: EventBus,
        @inject(TYPES.DomainEventBus)
        private domainEventBus: EventBus
    ) {
        this.setupMonitoring();
    }
    
    private setupMonitoring(): void {
        // 監控 UI 事件性能
        this.uiEventBus.on('*', this.measureEventTime);
        
        // 監控領域事件性能
        this.domainEventBus.on('*', this.measureEventTime);
    }
    
    private measureEventTime = (event: string): void => {
        const startTime = performance.now();
        
        // 在下一幀測量事件處理時間
        requestAnimationFrame(() => {
            const duration = performance.now() - startTime;
            
            if (!this.eventTimes.has(event)) {
                this.eventTimes.set(event, []);
            }
            
            const times = this.eventTimes.get(event)!;
            times.push(duration);
            
            if (times.length > 100) {
                times.shift();
            }
            
            const averageTime = this.getAverageEventTime(event);
            if (averageTime > 16) {
                console.warn(
                    `Event ${event} is taking too long:`,
                    averageTime.toFixed(2),
                    'ms'
                );
            }
        });
    };
    
    private getAverageEventTime(event: string): number {
        const times = this.eventTimes.get(event);
        if (!times || times.length === 0) return 0;
        return times.reduce((a, b) => a + b, 0) / times.length;
    }
}
```

## 最佳實踐

### 1. 事件命名規範

- UI 事件使用 `ui:` 前綴
- 領域事件使用 `domain:` 前綴
- 使用動詞-名詞格式
- 保持命名一致性

### 2. 事件處理原則

- 保持事件處理器輕量
- 避免在事件處理器中執行耗時操作
- 使用異步處理器處理複雜邏輯
- 及時清理事件監聽器

### 3. 事件數據設計

- 只傳遞必要的數據
- 使用類型安全的事件定義
- 避免傳遞大型對象
- 保持事件數據不可變

### 4. 錯誤處理

- 在事件處理器中捕獲錯誤
- 提供錯誤恢復機制
- 記錄錯誤日誌
- 避免事件處理失敗影響其他功能

## 參考資料

- [事件驅動架構](https://martinfowler.com/articles/201701-event-driven.html)
- [發布/訂閱模式](https://en.wikipedia.org/wiki/Publish%E2%80%93subscribe_pattern)
- [事件溯源](https://martinfowler.com/eaaDev/EventSourcing.html)
- [CQRS 模式](https://martinfowler.com/bliki/CQRS.html)
