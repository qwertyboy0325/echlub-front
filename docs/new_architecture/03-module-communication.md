# 模組間通信指南

## 通信架構概述

### 1. 事件驅動架構
```typescript
// 1. 定義事件接口
export interface IDomainEvent {
  eventType: string;
  aggregateId: string;
  timestamp: number;
  version: number;
  payload: unknown;
}

// 2. 實現具體事件
export class TrackCreatedEvent implements IDomainEvent {
  readonly eventType = 'TRACK_CREATED';
  readonly timestamp = Date.now();
  
  constructor(
    public readonly aggregateId: string,
    public readonly version: number,
    public readonly payload: {
      name: string;
      type: TrackType;
    }
  ) {}
}
```

### 2. 事件總線
```typescript
export interface IEventBus {
  publish<T extends IDomainEvent>(event: T): Promise<void>;
  subscribe<T extends IDomainEvent>(
    eventType: string,
    handler: (event: T) => Promise<void>
  ): Subscription;
}

@injectable()
export class EventBus implements IEventBus {
  private handlers = new Map<string, Set<EventHandler>>();
  
  async publish<T extends IDomainEvent>(event: T): Promise<void> {
    const handlers = this.handlers.get(event.eventType) || new Set();
    await Promise.all(
      Array.from(handlers).map(handler => handler(event))
    );
  }
  
  subscribe<T extends IDomainEvent>(
    eventType: string,
    handler: (event: T) => Promise<void>
  ): Subscription {
    const handlers = this.handlers.get(eventType) || new Set();
    handlers.add(handler);
    this.handlers.set(eventType, handlers);
    
    return {
      unsubscribe: () => {
        handlers.delete(handler);
      }
    };
  }
}
```

## 模組間狀態同步

### 1. 事件發布
```typescript
@injectable()
export class TrackEventPublisher {
  constructor(
    @inject(TYPES.EventBus) private eventBus: IEventBus
  ) {}
  
  async publishTrackCreated(track: Track): Promise<void> {
    const event = new TrackCreatedEvent(
      track.getId(),
      track.getVersion(),
      {
        name: track.getName(),
        type: track.getType()
      }
    );
    await this.eventBus.publish(event);
  }
}
```

### 2. 事件訂閱
```typescript
@injectable()
export class TrackEventHandler {
  constructor(
    @inject(TYPES.TrackRepository) private repository: ITrackRepository,
    @inject(TYPES.MixerService) private mixerService: IMixerService
  ) {}
  
  async handleTrackCreated(event: TrackCreatedEvent): Promise<void> {
    // 更新混音器狀態
    await this.mixerService.addTrackToMixer(event.aggregateId);
  }
  
  async handleTrackDeleted(event: TrackDeletedEvent): Promise<void> {
    // 清理相關資源
    await this.mixerService.removeTrackFromMixer(event.aggregateId);
  }
}
```

### 3. 事件存儲
```typescript
@injectable()
export class EventStore {
  private events: IDomainEvent[] = [];
  
  async saveEvent(event: IDomainEvent): Promise<void> {
    this.events.push(event);
  }
  
  async getEvents(aggregateId: string): Promise<IDomainEvent[]> {
    return this.events.filter(e => e.aggregateId === aggregateId);
  }
}
```

## 跨模組查詢

### 1. 查詢服務
```typescript
@injectable()
export class TrackQueryService {
  constructor(
    @inject(TYPES.TrackRepository) private repository: ITrackRepository,
    @inject(TYPES.PluginRepository) private pluginRepository: IPluginRepository
  ) {}
  
  async getTrackWithPlugins(trackId: string): Promise<TrackWithPlugins> {
    const track = await this.repository.findById(trackId);
    const plugins = await Promise.all(
      track.getPluginIds().map(id => 
        this.pluginRepository.findById(id)
      )
    );
    
    return {
      track,
      plugins
    };
  }
}
```

### 2. 視圖模型
```typescript
interface TrackViewModel {
  id: string;
  name: string;
  type: TrackType;
  plugins: PluginViewModel[];
  routing: RoutingViewModel;
}

@injectable()
export class TrackViewModelBuilder {
  async build(trackId: string): Promise<TrackViewModel> {
    // 組合來自不同模組的數據
  }
}
```

## 錯誤處理

### 1. 錯誤定義
```typescript
export class EventPublishError extends Error {
  constructor(
    public readonly eventType: string,
    public readonly cause: Error
  ) {
    super(`Failed to publish event ${eventType}: ${cause.message}`);
  }
}

export class EventHandleError extends Error {
  constructor(
    public readonly eventType: string,
    public readonly handler: string,
    public readonly cause: Error
  ) {
    super(`Handler ${handler} failed to process event ${eventType}: ${cause.message}`);
  }
}
```

### 2. 錯誤處理中間件
```typescript
@injectable()
export class EventErrorHandler {
  async handleError(error: Error, event: IDomainEvent): Promise<void> {
    if (error instanceof EventPublishError) {
      // 記錄失敗的事件
      await this.logFailedEvent(event);
      // 重試策略
      await this.retryEventPublish(event);
    }
  }
  
  private async retryEventPublish(event: IDomainEvent): Promise<void> {
    // 實現重試邏輯
  }
}
```

## 性能優化

### 1. 事件批處理
```typescript
@injectable()
export class BatchEventPublisher {
  private eventQueue: IDomainEvent[] = [];
  
  async queueEvent(event: IDomainEvent): Promise<void> {
    this.eventQueue.push(event);
    await this.processQueueIfNeeded();
  }
  
  private async processQueueIfNeeded(): Promise<void> {
    if (this.eventQueue.length >= BATCH_SIZE) {
      await this.processQueue();
    }
  }
}
```

### 2. 事件過濾
```typescript
@injectable()
export class EventFilter {
  shouldProcessEvent(event: IDomainEvent): boolean {
    // 實現事件過濾邏輯
    return true;
  }
}
```

## 測試策略

### 1. 事件發布測試
```typescript
describe('TrackEventPublisher', () => {
  it('應該正確發布事件', async () => {
    const publisher = new TrackEventPublisher(mockEventBus);
    const track = createMockTrack();
    
    await publisher.publishTrackCreated(track);
    
    expect(mockEventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'TRACK_CREATED',
        aggregateId: track.getId()
      })
    );
  });
});
```

### 2. 事件處理測試
```typescript
describe('TrackEventHandler', () => {
  it('應該正確處理事件', async () => {
    const handler = new TrackEventHandler(
      mockRepository,
      mockMixerService
    );
    
    await handler.handleTrackCreated(mockEvent);
    
    expect(mockMixerService.addTrackToMixer)
      .toHaveBeenCalledWith(mockEvent.aggregateId);
  });
});
```

## 最佳實踐

### 1. 事件版本控制
- 使用版本號追蹤事件變更
- 實現事件升級策略
- 處理向後兼容性

### 2. 事件文檔
- 維護事件目錄
- 記錄事件結構變更
- 提供訂閱指南

### 3. 監控和日誌
- 記錄事件處理時間
- 追蹤事件處理失敗
- 監控事件隊列大小 