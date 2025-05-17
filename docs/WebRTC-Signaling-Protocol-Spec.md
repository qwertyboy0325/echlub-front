# WebRTC 信令協議規格書

## 1. 概述

本文檔定義 Echlub 協作模組中的 WebRTC 信令協議，用於實現前端 P2P 連接和數據交換。此協議基於 WebSocket 作為信令通道，遵循標準 WebRTC 連接建立流程。

## 2. 連接流程

### 2.1 WebSocket 連接

- 連接端點: `{baseUrl}/collaboration?roomId={roomId}&peerId={peerId}`
- 連接參數:
  - `roomId`: 房間唯一標識符
  - `peerId`: 客戶端唯一標識符

### 2.2 房間事件

1. **加入房間**:
   - 當 WebSocket 連接建立後，客戶端自動發送 JOIN 事件
   - 服務器回應 ROOM_STATE 事件
   - 服務器向房間其他成員廣播 PLAYER_JOINED 事件

2. **離開房間**:
   - 客戶端發送 LEAVE 事件
   - 服務器向其他成員廣播 PLAYER_LEFT 事件

## 3. WebRTC 信令交換流程

### 3.1 WebRTC 連接建立流程

```
客戶端A                       信令服務器                      客戶端B
   |                             |                            |
   |---------- 加入房間 ---------->|                            |
   |                             |                            |
   |<------- 房間狀態回應 ---------|                            |
   |                             |                            |
   |                             |<--------- 加入房間 ----------|
   |                             |                            |
   |                             |--------- 房間狀態回應 ------->|
   |                             |                            |
   |<------ 玩家加入通知 ----------|------- 玩家加入通知 -------->|
   |                             |                            |
   |------ createOffer() ------->|                            |
   |                             |                            |
   |-------- 發送offer ---------->|-------- 轉發offer --------->|
   |                             |                            |
   |                             |                            |
   |                             |                            |--setRemoteDescription()
   |                             |                            |
   |                             |                            |--createAnswer()
   |                             |                            |
   |                             |<------- 發送answer ----------|
   |                             |                            |
   |<------- 轉發answer ----------|                            |
   |                             |                            |
   |--setRemoteDescription()     |                            |
   |                             |                            |
   |------- ICE候選項 ----------->|-------- ICE候選項 --------->|
   |                             |                            |
   |<------- ICE候選項 -----------|-------- ICE候選項 ----------|
   |                             |                            |
   |======== 建立P2P連接 ================================= 建立P2P連接 =|
   |                             |                            |
   |==== 數據通道直接傳輸（不經過信令服務器）======================>|
```

### 3.2 詳細步驟說明

1. **初始化**:
   - 客戶端A加入房間並初始化 WebRTC adapter
   - 客戶端B加入房間並初始化 WebRTC adapter

2. **建立 P2P 連接**:
   - 客戶端A (發起者) 創建 RTCPeerConnection
   - 客戶端A 創建 offer
   - 客戶端A 發送 offer 信令給客戶端B
   - 客戶端B 接收 offer 信令並創建 RTCPeerConnection
   - 客戶端B 設置遠程描述並創建 answer
   - 客戶端B 發送 answer 信令給客戶端A
   - 客戶端A 接收 answer 信令並設置遠程描述
   - 兩端交換 ICE candidate 信息
   - P2P 連接建立完成

3. **數據通道建立**:
   - 連接建立後，可創建多個命名數據通道進行數據交換
   - 數據通道通過 JSON 格式傳輸應用層數據

4. **連接監控與恢復**:
   - 監控 ICE 連接狀態變化
   - 連接異常時嘗試重連
   - 必要時降級至服務器中繼模式

## 4. 訊息格式

### 4.1 基本訊息結構

所有通過 WebSocket 發送的訊息遵循以下 JSON 格式:

```json
{
  "type": "<訊息類型>",
  "payload": {
    // 訊息特定內容
  }
}
```

### 4.2 房間事件訊息

#### 4.2.1 JOIN (加入房間)

```json
{
  "type": "join",
  "payload": {
    "roomId": "<房間ID>",
    "peerId": "<對等方ID>"
  }
}
```

#### 4.2.2 LEAVE (離開房間)

```json
{
  "type": "leave",
  "payload": {
    "roomId": "<房間ID>",
    "peerId": "<對等方ID>"
  }
}
```

#### 4.2.3 ROOM_STATE (房間狀態)

```json
{
  "type": "room-state",
  "payload": {
    "roomId": "<房間ID>",
    "players": ["<對等方ID1>", "<對等方ID2>", ...],
    "ownerId": "<房主ID>",
    "rules": {
      "maxPlayers": 4,
      "allowRelay": true,
      "latencyTargetMs": 100,
      "opusBitrate": 32000
    }
  }
}
```

#### 4.2.4 PLAYER_JOINED (玩家加入)

```json
{
  "type": "player-joined",
  "payload": {
    "peerId": "<對等方ID>",
    "roomId": "<房間ID>",
    "totalPlayers": 2,
    "isRoomOwner": false
  }
}
```

#### 4.2.5 PLAYER_LEFT (玩家離開)

```json
{
  "type": "player-left",
  "payload": {
    "peerId": "<對等方ID>",
    "roomId": "<房間ID>"
  }
}
```

### 4.3 WebRTC 信令訊息

#### 4.3.1 OFFER (連接提議)

```json
{
  "type": "offer",
  "payload": {
    "roomId": "<房間ID>",
    "from": "<發送方PeerId>",
    "to": "<接收方PeerId>",
    "recipient": "<接收方PeerId>",
    "offer": {
      "type": "offer",
      "sdp": "<SDP描述字串>"
    }
  }
}
```

#### 4.3.2 ANSWER (連接應答)

```json
{
  "type": "answer",
  "payload": {
    "roomId": "<房間ID>",
    "from": "<發送方PeerId>",
    "to": "<接收方PeerId>",
    "recipient": "<接收方PeerId>",
    "answer": {
      "type": "answer",
      "sdp": "<SDP描述字串>"
    }
  }
}
```

#### 4.3.3 ICE_CANDIDATE (網絡候選項)

```json
{
  "type": "ice-candidate",
  "payload": {
    "roomId": "<房間ID>",
    "from": "<發送方PeerId>",
    "to": "<接收方PeerId>",
    "recipient": "<接收方PeerId>",
    "candidate": {
      "candidate": "<ICE候選項字串>",
      "sdpMid": "<媒體流ID>",
      "sdpMLineIndex": "<媒體行索引>"
    }
  }
}
```

### 4.4 連接狀態訊息

#### 4.4.1 CONNECTION_STATE (連接狀態)

```json
{
  "type": "connection-state",
  "payload": {
    "roomId": "<房間ID>",
    "peerId": "<對等方ID>",
    "state": "<連接狀態>" // disconnected, connecting, connected, relaying, fallback, error
  }
}
```

#### 4.4.2 RECONNECT_REQUEST (重連請求)

```json
{
  "type": "reconnect-request",
  "payload": {
    "roomId": "<房間ID>",
    "from": "<發送方PeerId>",
    "to": "<接收方PeerId>"
  }
}
```

### 4.5 備援模式訊息

#### 4.5.1 FALLBACK_ACTIVATE (啟用備援)

```json
{
  "type": "webrtc-fallback-activate",
  "payload": {
    "roomId": "<房間ID>",
    "from": "<發送方PeerId>",
    "to": "<接收方PeerId>"
  }
}
```

#### 4.5.2 RELAY_DATA (中繼數據)

```json
{
  "type": "relay-data",
  "payload": {
    "roomId": "<房間ID>",
    "from": "<發送方PeerId>",
    "to": "<接收方PeerId>",
    "payload": {
      "channel": "<通道名稱>",
      "data": {
        // 應用層數據
      }
    }
  }
}
```

## 5. 錯誤處理與恢復機制

### 5.1 連接錯誤類型

- **ICE連接失敗**: 無法建立直接P2P連接
- **信令連接丟失**: WebSocket連接斷開
- **數據通道錯誤**: 已建立的數據通道中斷

### 5.2 恢復策略

1. **重連嘗試**:
   - WebSocket斷開自動重連最多嘗試5次
   - 每次重連間隔2秒
   - 重連成功後自動重新加入房間

2. **P2P連接恢復**:
   - ICE連接失敗時發送RECONNECT_REQUEST
   - 接收方創建新的P2P連接
   - 重新交換offer/answer/candidate

3. **備援模式**:
   - 多次P2P重連失敗後啟用備援模式
   - 通過FALLBACK_ACTIVATE告知對方
   - 切換到RELAY_DATA機制傳輸數據

## 6. 安全考量

1. **連接身份驗證**:
   - WebSocket連接需要提供有效的roomId和peerId
   - 服務器驗證客戶端是否有權限加入特定房間

2. **數據安全**:
   - WebRTC連接使用DTLS加密數據傳輸
   - 敏感數據應在應用層額外加密

3. **服務器保護**:
   - 實施速率限制防止DoS攻擊
   - 驗證訊息格式和內容

## 7. 後端實現要求

後端服務器需實現以下功能:

1. **WebSocket服務**:
   - 處理連接/斷開事件
   - 解析和驗證訊息
   - 根據type和payload路由訊息

2. **房間管理**:
   - 創建/關閉房間
   - 追蹤房間成員
   - 驗證規則與限制

3. **信令中繼**:
   - 準確轉發offer/answer/candidate訊息
   - 維護每個房間的連接拓撲
   - 處理P2P連接失敗的備援機制

4. **錯誤處理**:
   - 返回結構化錯誤信息
   - 記錄連接問題以便診斷
   - 實施適當的恢復策略

5. **擴展性**:
   - 支持水平擴展
   - 房間狀態可在多個節點間共享

## 8. 相容性與效能考量

1. **瀏覽器相容性**:
   - 支持所有主流現代瀏覽器（Chrome、Firefox、Safari、Edge）
   - 處理瀏覽器間WebRTC實現差異

2. **網絡穿透**:
   - 配置STUN服務器用於NAT穿透
   - 提供TURN服務器作為備援選項

3. **效能優化**:
   - 小型房間使用全網格拓撲（每個客戶端直接連接所有其他客戶端）
   - 大型房間可考慮使用SFU架構

4. **資源限制**:
   - 房間最大人數限制（推薦≤10）
   - 可調整的數據通道參數（ordered, maxRetransmits）
   - 適當的ICE候選項限制

## 9. 附錄: 連接狀態轉換

| 狀態          | 描述                     | 觸發條件                               |
|--------------|-------------------------|---------------------------------------|
| disconnected | 斷開或未連接               | 初始狀態、連接關閉                       |
| connecting   | 嘗試連接中                | 開始ICE交換                            |
| connected    | 連接成功並可傳輸數據         | ICE連接成功                            |
| relaying     | 使用TURN服務器中繼         | 直接P2P失敗但TURN可用                   |
| fallback     | 使用WS服務器中繼           | ICE完全失敗、啟用備援                    |
| error        | 連接錯誤無法恢復           | 嚴重錯誤或多次重連失敗                    | 