# 事件溯源實現計劃

## 當前問題
1. 缺乏完整的聚合根狀態追蹤
2. 無法重現歷史狀態
3. 缺乏審計追蹤能力

## 目標
1. 實現完整的事件溯源機制
2. 提供狀態重現能力
3. 建立審計追蹤系統

## 具體任務

### 1. 事件存儲
- [ ] 建立事件存儲介面
  ```typescript
  interface IEventStore {
    save(aggregateId: string, events: DomainEvent[], expectedVersion: number): Promise<void>;
    getEvents(aggregateId: string): Promise<DomainEvent[]>;
    getEventsByType(eventType: string): Promise<DomainEvent[]>;
  }
  ```

- [ ] 實現事件存儲
  ```
  src/shared/infrastructure/event-store/
  ├── EventStore.ts
  ├── InMemoryEventStore.ts
  └── MongoEventStore.ts
  ```

### 2. 聚合根重構
- [ ] 建立基礎聚合根類
  ```typescript
  abstract class AggregateRoot {
    private _version: number = 0;
    private _changes: DomainEvent[] = [];

    get version(): number {
      return this._version;
    }

    get uncommittedChanges(): DomainEvent[] {
      return this._changes;
    }

    protected applyChange(event: DomainEvent): void {
      this._changes.push(event);
      this.apply(event);
    }

    protected abstract apply(event: DomainEvent): void;

    public markChangesAsCommitted(): void {
      this._changes = [];
    }

    public loadFromHistory(history: DomainEvent[]): void {
      history.forEach(event => {
        this.apply(event);
        this._version++;
      });
    }
  }
  ```

- [ ] 重構現有聚合根
  ```
  src/modules/track/domain/
  ├── Track.ts
  ├── Clip.ts
  └── Note.ts
  ```

### 3. 快照管理
- [ ] 建立快照介面
  ```typescript
  interface ISnapshot<T> {
    aggregateId: string;
    version: number;
    state: T;
    timestamp: Date;
  }

  interface ISnapshotStore {
    save<T>(snapshot: ISnapshot<T>): Promise<void>;
    getLatest<T>(aggregateId: string): Promise<ISnapshot<T> | null>;
  }
  ```

- [ ] 實現快照存儲
  ```
  src/shared/infrastructure/snapshot-store/
  ├── SnapshotStore.ts
  ├── InMemorySnapshotStore.ts
  └── MongoSnapshotStore.ts
  ```

### 4. 事件重放
- [ ] 建立事件重放器
  ```typescript
  interface IEventReplayer {
    replay(aggregateId: string, toVersion?: number): Promise<void>;
    replayAll(toDate?: Date): Promise<void>;
  }
  ```

- [ ] 實現事件重放器
  ```
  src/shared/domain/event-replayer/
  ├── EventReplayer.ts
  └── MongoEventReplayer.ts
  ```

## 時間安排
1. 第1-2週：事件存儲實現
2. 第3-4週：聚合根重構
3. 第5-6週：快照管理實現
4. 第7-8週：事件重放實現

## 注意事項
1. 確保事件的不可變性
2. 實現高效的事件查詢
3. 考慮事件存儲的擴展性
4. 實現快照的定期創建
5. 提供事件重放的並發控制 