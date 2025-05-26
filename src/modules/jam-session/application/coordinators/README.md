# 協調器 (Coordinators)

協調器負責協調不同聚合根間的交互，處理應用層的業務流程。本目錄下包含兩個主要協調器：

## SessionCoordinator

`SessionCoordinator` 專注於管理會話生命週期、玩家管理和整體狀態轉換：

- 創建和結束會話
- 管理玩家資訊（加入、角色分配、準備狀態）
- 處理外部系統事件（如 Peer 離開房間、房間關閉）

```typescript
// 注入到處理器中使用
constructor(
  @inject(JamSessionTypes.SessionCoordinator) private coordinator: SessionCoordinator
) {}

// 使用示例
await this.coordinator.createSession(roomId, initiatorPeerId);
await this.coordinator.setPlayerRole(sessionId, peerId, roleId);
await this.coordinator.togglePlayerReady(sessionId, peerId, isReady);
await this.coordinator.startJamSession(sessionId);
await this.coordinator.endJamSession(sessionId);
```

## RoundCoordinator

`RoundCoordinator` 專注於回合內操作、音軌管理和回合完成邏輯：

- 開始和結束回合
- 管理音軌加入
- 處理玩家回合完成和確認
- 處理回合相關事件

```typescript
// 注入到處理器中使用
constructor(
  @inject(JamSessionTypes.RoundCoordinator) private coordinator: RoundCoordinator
) {}

// 使用示例
await this.coordinator.startNewRound(sessionId, durationSeconds);
await this.coordinator.endCurrentRound(sessionId);
await this.coordinator.addTrackToRound(sessionId, trackId, playerId);
await this.coordinator.markPlayerRoundCompletion(sessionId, playerId);
await this.coordinator.confirmNextRound(sessionId, playerId, roundId);
```

## 協調器與領域服務的關係

協調器使用領域服務 `JamSessionDomainService` 處理核心領域邏輯，確保業務規則的一致性。
協調器負責基礎設施交互（如資料存儲、事件發布），而領域服務只關注純領域邏輯。

## 事件處理

兩個協調器都會監聽特定的事件：

- `SessionCoordinator`: 監聽外部系統事件（如 `collab.peer-left-room`）
- `RoundCoordinator`: 監聽回合相關事件（如 `jam.round-ended`）

當事件發生時，協調器會自動響應並執行相應邏輯。 