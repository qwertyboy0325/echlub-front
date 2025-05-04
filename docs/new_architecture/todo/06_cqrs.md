# CQRS實現計劃

## 當前問題
1. 命令和查詢混合在同一個模型中
2. 缺乏讀寫分離的優化
3. 查詢性能受限

## 目標
1. 實現命令和查詢的完全分離
2. 優化讀寫性能
3. 提供靈活的查詢能力

## 具體任務

### 1. 命令處理
- [ ] 建立命令介面
  ```typescript
  interface ICommand {
    readonly type: string;
  }

  interface ICommandHandler<T extends ICommand> {
    handle(command: T): Promise<void>;
  }
  ```

- [ ] 實現命令總線
  ```typescript
  interface ICommandBus {
    registerHandler<T extends ICommand>(commandType: string, handler: ICommandHandler<T>): void;
    dispatch<T extends ICommand>(command: T): Promise<void>;
  }
  ```

- [ ] 實現命令處理器
  ```
  src/shared/application/commands/
  ├── CommandBus.ts
  ├── CreateTrackCommand.ts
  ├── UpdateTrackCommand.ts
  └── handlers/
      ├── CreateTrackHandler.ts
      └── UpdateTrackHandler.ts
  ```

### 2. 查詢處理
- [ ] 建立查詢介面
  ```typescript
  interface IQuery<TResult> {
    readonly type: string;
  }

  interface IQueryHandler<TQuery extends IQuery<TResult>, TResult> {
    handle(query: TQuery): Promise<TResult>;
  }
  ```

- [ ] 實現查詢總線
  ```typescript
  interface IQueryBus {
    registerHandler<TQuery extends IQuery<TResult>, TResult>(
      queryType: string,
      handler: IQueryHandler<TQuery, TResult>
    ): void;
    dispatch<TQuery extends IQuery<TResult>, TResult>(query: TQuery): Promise<TResult>;
  }
  ```

- [ ] 實現查詢處理器
  ```
  src/shared/application/queries/
  ├── QueryBus.ts
  ├── GetTrackByIdQuery.ts
  ├── GetTracksByProjectQuery.ts
  └── handlers/
      ├── GetTrackByIdHandler.ts
      └── GetTracksByProjectHandler.ts
  ```

### 3. 讀模型
- [ ] 建立讀模型介面
  ```typescript
  interface IReadModel<T> {
    id: string;
    version: number;
    data: T;
  }
  ```

- [ ] 實現讀模型存儲
  ```
  src/shared/infrastructure/read-models/
  ├── ReadModelStore.ts
  ├── InMemoryReadModelStore.ts
  └── MongoReadModelStore.ts
  ```

### 4. 事件處理器
- [ ] 建立事件處理器
  ```typescript
  interface IEventHandler<T extends DomainEvent> {
    handle(event: T): Promise<void>;
  }
  ```

- [ ] 實現讀模型更新器
  ```
  src/shared/application/event-handlers/
  ├── TrackReadModelUpdater.ts
  ├── ClipReadModelUpdater.ts
  └── NoteReadModelUpdater.ts
  ```

## 時間安排
1. 第1-2週：命令處理實現
2. 第3-4週：查詢處理實現
3. 第5-6週：讀模型實現
4. 第7-8週：事件處理器實現

## 注意事項
1. 確保命令的冪等性
2. 實現查詢結果的緩存
3. 考慮讀寫模型的一致性
4. 提供適當的錯誤處理
5. 實現必要的監控和日誌 