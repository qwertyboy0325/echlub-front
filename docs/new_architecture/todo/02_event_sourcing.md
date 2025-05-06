# Event Sourcing 實現計劃

## 當前問題

1. 缺乏完整的 Event Sourcing 實現
2. 狀態管理分散在各個實體中
3. 缺乏事件溯源能力

## 目標

1. 實現完整的 Event Sourcing 架構
2. 集中管理狀態變更
3. 提供事件溯源能力

## 具體任務

### 1. Event Store 實現

- [ ] 建立 Event Store 介面

  ```typescript
  interface IEventStore {
    saveEvents(aggregateId: string, events: DomainEvent[], expectedVersion: number): Promise<void>;
    getEvents(aggregateId: string): Promise<DomainEvent[]>;
    getEventsByType(eventType: string): Promise<DomainEvent[]>;
  }
  ```

- [ ] 實現 Event Store

  ```
  src/core/event-sourcing/
  ├── interfaces/
  │   └── IEventStore.ts
  ├── implementations/
  │   └── InMemoryEventStore.ts
  └── EventStoreFactory.ts
  ```

### 2. Aggregate Root 實現

- [ ] 建立 Aggregate Root 基礎類別

  ```typescript
  abstract class AggregateRoot {
    private version: number = -1;
    private changes: DomainEvent[] = [];
    
    protected apply(event: DomainEvent): void;
    protected loadFromHistory(events: DomainEvent[]): void;
    public getUncommittedChanges(): DomainEvent[];
    public markChangesAsCommitted(): void;
  }
  ```

- [ ] 實現具體的 Aggregate Roots

  ```
  src/modules/track/domain/aggregates/
  ├── TrackAggregate.ts
  ├── ClipAggregate.ts
  └── NoteAggregate.ts
  ```

### 3. 事件處理器

- [ ] 建立事件處理器介面

  ```typescript
  interface IEventHandler<T extends DomainEvent> {
    handle(event: T): Promise<void>;
  }
  ```

- [ ] 實現具體的事件處理器

  ```
  src/modules/track/infrastructure/event-handlers/
  ├── TrackEventHandler.ts
  ├── ClipEventHandler.ts
  └── NoteEventHandler.ts
  ```

### 4. 快照機制

- [ ] 實現快照策略

  ```typescript
  interface ISnapshotStrategy {
    shouldTakeSnapshot(aggregate: AggregateRoot): boolean;
  }
  ```

- [ ] 實現快照存儲

  ```
  src/core/event-sourcing/snapshots/
  ├── interfaces/
  │   └── ISnapshotStore.ts
  ├── implementations/
  │   └── InMemorySnapshotStore.ts
  └── SnapshotStrategy.ts
  ```

## 時間安排

1. 第1週：Event Store 實現
2. 第2週：Aggregate Root 實現
3. 第3週：事件處理器實現
4. 第4週：快照機制實現

## 注意事項

1. 確保事件序列化/反序列化的正確性
2. 實現適當的並發控制
3. 考慮性能優化
4. 實現適當的錯誤處理
5. 添加必要的日誌記錄
