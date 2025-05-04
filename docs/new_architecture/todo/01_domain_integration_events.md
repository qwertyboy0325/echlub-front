# Domain Event 與 Integration Event 重整計劃

## 當前問題

1. Domain Events 主要用於外部通信，而非內部領域邏輯
2. 缺乏清晰的 Integration Events 層
3. 事件命名和結構不一致

## 目標

1. 分離內部 Domain Events 和外部 Integration Events
2. 建立清晰的事件分層結構
3. 統一事件命名規範和結構

## 具體任務

### 1. Domain Events 重構

- [ ] 建立新的 Domain Events 目錄結構

  ```
  src/modules/track/domain/events/
  ├── track/
  │   ├── TrackCreatedEvent.ts
  │   ├── TrackStateChangedEvent.ts
  │   └── TrackDeletedEvent.ts
  ├── clip/
  │   ├── ClipCreatedEvent.ts
  │   ├── ClipStateChangedEvent.ts
  │   └── ClipDeletedEvent.ts
  └── note/
      ├── NoteAddedEvent.ts
      ├── NoteUpdatedEvent.ts
      └── NoteRemovedEvent.ts
  ```

- [ ] 重構現有 Domain Events
  - 移除外部通信相關的事件
  - 專注於領域狀態變更
  - 添加必要的領域上下文

### 2. Integration Events 建立

- [ ] 建立 Integration Events 目錄結構

  ```
  src/modules/track/infrastructure/events/
  ├── track/
  │   ├── TrackCreatedIntegrationEvent.ts
  │   ├── TrackUpdatedIntegrationEvent.ts
  │   └── TrackDeletedIntegrationEvent.ts
  ├── clip/
  │   ├── ClipCreatedIntegrationEvent.ts
  │   ├── ClipUpdatedIntegrationEvent.ts
  │   └── ClipDeletedIntegrationEvent.ts
  └── note/
      ├── NoteAddedIntegrationEvent.ts
      ├── NoteUpdatedIntegrationEvent.ts
      └── NoteRemovedIntegrationEvent.ts
  ```

- [ ] 實現 Integration Events
  - 添加必要的元數據
  - 實現事件版本控制
  - 添加事件序列化/反序列化

### 3. 事件轉換層

- [ ] 建立事件轉換器

  ```
  src/modules/track/infrastructure/events/converters/
  ├── TrackEventConverter.ts
  ├── ClipEventConverter.ts
  └── NoteEventConverter.ts
  ```

- [ ] 實現事件轉換邏輯
  - Domain Event 到 Integration Event 的轉換
  - 版本兼容性處理
  - 錯誤處理

### 4. 事件發布/訂閱系統

- [ ] 建立事件總線

  ```
  src/core/event-bus/
  ├── DomainEventBus.ts
  └── IntegrationEventBus.ts
  ```

- [ ] 實現事件處理器

  ```
  src/modules/track/infrastructure/event-handlers/
  ├── domain/
  │   └── TrackDomainEventHandler.ts
  └── integration/
      └── TrackIntegrationEventHandler.ts
  ```

## 時間安排

1. 第1週：Domain Events 重構
2. 第2週：Integration Events 建立
3. 第3週：事件轉換層實現
4. 第4週：事件發布/訂閱系統實現

## 注意事項

1. 保持向後兼容性
2. 確保事件處理的冪等性
3. 實現適當的錯誤處理
4. 添加必要的日誌記錄
5. 考慮性能影響
