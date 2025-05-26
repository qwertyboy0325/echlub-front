# JamSession 事件命名統一遷移指南

## 概述

本文檔記錄了 JamSession 模組事件命名的統一化過程，確保所有事件名稱符合架構文檔的標準約定。

## 標準事件類型

所有事件類型現在統一定義在 `EventTypes.ts` 文件中：

```typescript
export const JamEventTypes = {
  // Session 生命週期事件
  SESSION_CREATED: 'jam.session-created',
  SESSION_STARTED: 'jam.session-started', 
  SESSION_ENDED: 'jam.session-ended',
  
  // Player 相關事件
  PLAYER_ADDED: 'jam.player-added',
  PLAYER_ROLE_SET: 'jam.player-role-set',
  PLAYER_READY: 'jam.player-ready',
  PLAYER_LEFT_SESSION: 'jam.player-left-session',
  
  // Round 相關事件
  ROUND_STARTED: 'jam.round-started',
  ROUND_ENDED: 'jam.round-ended',
  ROUND_COMPLETED: 'jam.round-completed',
  NEXT_ROUND_PREPARED: 'jam.next-round-prepared',
  
  // Track 相關事件
  TRACK_CREATED: 'jam.track-created',
  TRACK_ADDED_TO_ROUND: 'jam.track-added-to-round',
  
  // 玩家狀態事件
  PLAYER_COMPLETED_ROUND: 'jam.player-completed-round',
  PLAYER_CONFIRMED_NEXT_ROUND: 'jam.player-confirmed-next-round',
  
  // 系統事件
  COUNTDOWN_TICK: 'jam.countdown-tick'
} as const;
```

## 修正的事件名稱

| 舊事件名稱 | 新事件名稱 | 修正原因 |
|-----------|-----------|----------|
| `jam.player-ready-toggled` | `jam.player-ready` | 符合文檔標準 |
| `jam.player-unavailable` | `jam.player-left-session` | 符合文檔標準 |

## 統一的事件類別

### 標準事件類別

以下事件類別現在使用統一的事件類型常數：

- `JamSessionCreatedEvent` → `JamEventTypes.SESSION_CREATED`
- `JamSessionStartedEvent` → `JamEventTypes.SESSION_STARTED`
- `JamSessionEndedEvent` → `JamEventTypes.SESSION_ENDED`
- `PlayerAddedEvent` → `JamEventTypes.PLAYER_ADDED`
- `PlayerRoleSetEvent` → `JamEventTypes.PLAYER_ROLE_SET`
- `PlayerReadyToggledEvent` → `JamEventTypes.PLAYER_READY`
- `PlayerUnavailableEvent` → `JamEventTypes.PLAYER_LEFT_SESSION`
- `NextRoundStartedEvent` → `JamEventTypes.ROUND_STARTED`
- `CurrentRoundEndedEvent` → `JamEventTypes.ROUND_ENDED`

### 棄用的事件類別

以下事件類別已標記為棄用，但保留向後兼容性：

- `RoundStartedEvent` → 請使用 `NextRoundStartedEvent`
- `RoundEndedEvent` → 請使用 `CurrentRoundEndedEvent`

## 使用指南

### 在事件類別中使用

```typescript
import { DomainEvent } from '@/core/events/DomainEvent';
import { JamEventTypes } from '../EventTypes';

export class MyEvent extends DomainEvent {
  constructor(sessionId: string) {
    super(JamEventTypes.SESSION_CREATED, sessionId);
  }
}
```

### 在事件處理器中使用

```typescript
import { JamEventTypes } from '../../domain/events/EventTypes';

// 訂閱事件
eventBus.subscribe(JamEventTypes.SESSION_CREATED, handler);

// 發布事件
eventBus.publish(JamEventTypes.SESSION_CREATED, eventData);
```

### 在前端中使用

```typescript
import { JamEventTypes } from './domain/events/EventTypes';

// WebSocket 事件監聽
signalHub.on(JamEventTypes.SESSION_CREATED, onSessionCreated);

// 發送命令
signalHub.send('jam.create-session', commandData);
```

## 驗證工具

使用 `isValidJamEventType()` 函數驗證事件類型：

```typescript
import { isValidJamEventType } from './EventTypes';

if (isValidJamEventType(eventType)) {
  // 處理有效的 JamSession 事件
}
```

## 遷移檢查清單

- [x] 創建 `EventTypes.ts` 統一事件類型定義
- [x] 更新所有事件類別使用 `JamEventTypes` 常數
- [x] 修正不符合文檔標準的事件名稱
- [x] 標記棄用的重複事件類別
- [x] 更新事件索引文件
- [ ] 更新所有事件處理器使用新的事件類型
- [ ] 更新前端代碼使用新的事件類型
- [ ] 更新測試代碼使用新的事件類型
- [ ] 更新文檔和範例代碼

## 注意事項

1. **向後兼容性**：舊的事件類別仍然可用，但建議遷移到新的標準事件
2. **類型安全**：使用 `JamEventType` 聯合類型確保類型安全
3. **一致性**：所有新代碼都應該使用 `JamEventTypes` 常數
4. **驗證**：使用 `isValidJamEventType()` 驗證事件類型的有效性 