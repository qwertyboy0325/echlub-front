# 領域事件實現計劃

## 當前問題

1. 缺乏統一的領域事件定義
2. 事件發布和訂閱機制不完善
3. 缺乏事件處理的追蹤機制

## 目標

1. 建立統一的領域事件系統
2. 實現可靠的事件發布和訂閱機制
3. 提供事件處理的追蹤能力

## 具體任務

### 1. 領域事件定義

- [ ] 建立基礎事件類

  ```typescript
  abstract class DomainEvent {
    constructor(
      public readonly eventId: string,
      public readonly aggregateId: string,
      public readonly occurredOn: Date
    ) {}
  }
  ```

- [ ] 實現具體事件

  ```
  src/modules/track/domain/events/
  ├── TrackCreatedEvent.ts
  ├── TrackUpdatedEvent.ts
  ├── TrackDeletedEvent.ts
  ├── ClipAddedEvent.ts
  ├── ClipUpdatedEvent.ts
  ├── ClipDeletedEvent.ts
  ├── NoteAddedEvent.ts
  ├── NoteUpdatedEvent.ts
  └── NoteDeletedEvent.ts
  ```

### 2. 事件發布者

- [ ] 建立事件發布者介面

  ```typescript
  interface IEventPublisher {
    publish(event: DomainEvent): Promise<void>;
    publishAll(events: DomainEvent[]): Promise<void>;
  }
  ```

- [ ] 實現事件發布者

  ```
  src/shared/domain/event-publisher/
  ├── EventPublisher.ts
  └── InMemoryEventPublisher.ts
  ```

### 3. 事件訂閱者

- [ ] 建立事件訂閱者介面

  ```typescript
  interface IEventSubscriber {
    subscribe(eventType: string, handler: (event: DomainEvent) => Promise<void>): void;
    unsubscribe(eventType: string, handler: (event: DomainEvent) => Promise<void>): void;
  }
  ```

- [ ] 實現事件訂閱者

  ```
  src/shared/domain/event-subscriber/
  ├── EventSubscriber.ts
  └── InMemoryEventSubscriber.ts
  ```

### 4. 事件處理器

- [ ] 建立事件處理器介面

  ```typescript
  interface IEventHandler<T extends DomainEvent> {
    handle(event: T): Promise<void>;
  }
  ```

- [ ] 實現具體事件處理器

  ```
  src/modules/track/application/event-handlers/
  ├── TrackCreatedEventHandler.ts
  ├── TrackUpdatedEventHandler.ts
  ├── TrackDeletedEventHandler.ts
  ├── ClipAddedEventHandler.ts
  ├── ClipUpdatedEventHandler.ts
  ├── ClipDeletedEventHandler.ts
  ├── NoteAddedEventHandler.ts
  ├── NoteUpdatedEventHandler.ts
  └── NoteDeletedEventHandler.ts
  ```

## 時間安排

1. 第1週：領域事件定義
2. 第2週：事件發布者實現
3. 第3週：事件訂閱者實現
4. 第4週：事件處理器實現

## 注意事項

1. 確保事件的不可變性
2. 實現事件的序列化和反序列化
3. 考慮事件的版本控制
4. 實現事件的重放機制
5. 提供事件處理的錯誤恢復機制
