# Echlub 協作模組協議規格書

## 1. 概述

Echlub 協作模組負責管理房間的生命週期（創建、加入、離開、關閉）以及參與者之間的 P2P 連接。本文檔定義了前後端之間所有交換的數據格式和工作流程，供開發團隊實現時參考。

## 2. 系統架構

```
+-------------------+     +-------------------+     +-------------------+
|                   |     |                   |     |                   |
|   客戶端 A         |<--->|   信令服務器        |<--->|   客戶端 B         |
|                   |     |                   |     |                   |
+-------------------+     +-------------------+     +-------------------+
        ^                         ^                         ^
        |                         |                         |
        v                         v                         v
+-------------------+     +-------------------+     +-------------------+
|                   |     |                   |     |                   |
|   WebRTC P2P      |<--->|  REST API 服務器   |<--->|   WebRTC P2P      |
|   (直接數據交換)    |     |  (房間管理/查詢)    |     |   (直接數據交換)    |
|                   |     |                   |     |                   |
+-------------------+     +-------------------+     +-------------------+
```

### 2.1 模組組成

1. **REST API**: 房間管理，提供房間創建、查詢、修改規則、關閉功能
2. **WebSocket 信令服務**: 提供信令交換，支持 WebRTC 連接建立
3. **WebRTC P2P 連接**: 客戶端之間的直接數據交換
4. **備援機制**: 當 P2P 連接失敗時的中繼通訊方案

## 3. 完整協作流程

### 3.1 房間生命週期流程

```
創建者                            參與者                           後端服務器
   |                               |                                |
   |-- 1. 創建房間請求 (REST) ------>|                                |
   |                               |                                |
   |<- 2. 返回房間信息 + roomId -----|                                |
   |                               |                                |
   |-- 3. 連接信令服務器 (WS) ------>|                                |
   |                               |                                |
   |<- 4. 確認房間加入 --------------|                                |
   |                               |                                |
   |                               |-- 5. 查詢房間列表 (REST) -------->|
   |                               |                                |
   |                               |<- 6. 返回可用房間列表 ------------|
   |                               |                                |
   |                               |-- 7. 選擇並加入房間 (REST) ------>|
   |                               |                                |
   |                               |<- 8. 返回房間詳情 ----------------|
   |                               |                                |
   |                               |-- 9. 連接信令服務器 (WS) -------->|
   |                               |                                |
   |<------- 10. 新成員加入通知 ------|-- 10. 發送加入通知 --------------|
   |                               |                                |
   |<==== 11. 建立 WebRTC P2P 連接 (信令交換) ==>|                    |
   |                               |                                |
   |<=== 12. 直接 P2P 數據交換 (不經過服務器) ===>|                    |
   |                               |                                |
   |-- 13. 離開房間 (WS) ----------->|                                |
   |                               |                                |
   |                               |<---- 13. 成員離開通知 ------------|
   |                               |                                |
   |                               |-- 14. 離開房間 (WS) ------------>|
   |                               |                                |
   |                               |-- 15. 關閉房間 (REST，房主權限) -->|
```

### 3.2 資料交換時序

```
創建者                           參與者                       後端服務器
   |                              |                            |
   |-- 建立房間 --------------------> 廣播房間創建 ----------------> 所有客戶端
   |                              |                            |
   |<------------------------ 玩家加入房間 -----------------------|
   |                              |                            |
   |-- 交換 WebRTC 信令 -----------> 信令轉發 --------------------> 目標客戶端
   |                              |                            |
   |<==== 建立 P2P 連接並創建數據通道 ====>|                      |
   |                              |                            |
   |-- 發送房間消息 (P2P) ---------->|                           |
   |                              |                            |
   |<----------- 發送房間消息 (P2P) --|                           |
   |                              |                            |
   |-- 規則變更 (REST) -------------> 規則變更處理 ----------------> 廣播變更
   |                              |                            |
   |<------------------------ 房間規則變更通知 -------------------|
   |                              |                            |
   |-- 關閉房間 (REST) -------------> 處理房間關閉 ----------------> 廣播關閉
   |                              |                            |
   |<------------------------ 房間關閉通知 ----------------------|
```

## 4. REST API 端點

### 4.1 創建房間

- **請求方法**: POST
- **URL**: `/api/rooms`
- **請求體**:
```json
{
  "name": "測試房間",
  "description": "這是一個測試房間",
  "maxPlayers": 4,
  "allowRelay": true,
  "latencyTargetMs": 100,
  "opusBitrate": 32000,
  "ownerId": "<創建者的 PeerId>"
}
```
- **響應**:
```json
{
  "success": true,
  "data": {
    "roomId": "<新房間的唯一ID>",
    "name": "測試房間",
    "description": "這是一個測試房間",
    "players": [{"id": "<創建者的 PeerId>", "isOwner": true}],
    "createdAt": "2023-08-01T12:00:00Z",
    "rules": {
      "maxPlayers": 4,
      "allowRelay": true,
      "latencyTargetMs": 100,
      "opusBitrate": 32000
    }
  }
}
```

### 4.2 獲取房間列表

- **請求方法**: GET
- **URL**: `/api/rooms`
- **查詢參數**:
  - `limit` (可選): 返回結果數量限制
  - `offset` (可選): 分頁偏移
  - `filter` (可選): 過濾條件，如 `{"maxPlayers": 4}`
- **響應**:
```json
{
  "success": true,
  "data": {
    "rooms": [
      {
        "roomId": "<房間ID>",
        "name": "測試房間1",
        "description": "這是測試房間1",
        "playerCount": 2,
        "maxPlayers": 4,
        "createdAt": "2023-08-01T12:00:00Z"
      },
      {
        "roomId": "<房間ID>",
        "name": "測試房間2",
        "description": "這是測試房間2",
        "playerCount": 1,
        "maxPlayers": 4,
        "createdAt": "2023-08-01T14:30:00Z"
      }
    ],
    "total": 2
  }
}
```

### 4.3 獲取房間詳情

- **請求方法**: GET
- **URL**: `/api/rooms/{roomId}`
- **響應**:
```json
{
  "success": true,
  "data": {
    "roomId": "<房間ID>",
    "name": "測試房間",
    "description": "這是一個測試房間",
    "players": [
      {"id": "<用戶1 ID>", "isOwner": true, "joinedAt": "2023-08-01T12:00:00Z"},
      {"id": "<用戶2 ID>", "isOwner": false, "joinedAt": "2023-08-01T12:05:00Z"}
    ],
    "createdAt": "2023-08-01T12:00:00Z",
    "rules": {
      "maxPlayers": 4,
      "allowRelay": true,
      "latencyTargetMs": 100,
      "opusBitrate": 32000
    }
  }
}
```

### 4.4 更新房間規則

- **請求方法**: PATCH
- **URL**: `/api/rooms/{roomId}/rules`
- **請求體**:
```json
{
  "maxPlayers": 6,
  "allowRelay": false,
  "latencyTargetMs": 150,
  "opusBitrate": 24000,
  "ownerId": "<房主ID>"
}
```
- **響應**:
```json
{
  "success": true,
  "data": {
    "roomId": "<房間ID>",
    "rules": {
      "maxPlayers": 6,
      "allowRelay": false,
      "latencyTargetMs": 150,
      "opusBitrate": 24000
    },
    "updatedAt": "2023-08-01T13:00:00Z"
  }
}
```

### 4.5 關閉房間

- **請求方法**: DELETE
- **URL**: `/api/rooms/{roomId}?ownerId={ownerId}`
- **響應**:
```json
{
  "success": true,
  "data": {
    "roomId": "<已關閉的房間ID>",
    "closedAt": "2023-08-01T15:00:00Z"
  }
}
```

## 5. WebSocket 信令通道

### 5.1 連接方式

- **WebSocket URL**: `ws://{baseUrl}/collaboration?roomId={roomId}&peerId={peerId}`
- **連接參數**:
  - `roomId`: 房間唯一標識符
  - `peerId`: 客戶端唯一標識符
- **連接事件**:
  - 連接成功後，客戶端自動發送 JOIN 事件
  - 服務器返回 ROOM_STATE 事件
  - 其他成員收到 PLAYER_JOINED 事件

### 5.2 信令消息格式

所有通過 WebSocket 發送的訊息遵循以下 JSON 格式:

```json
{
  "type": "<訊息類型>",
  "payload": {
    // 訊息特定內容
  }
}
```

### 5.3 房間事件訊息

#### 5.3.1 JOIN (加入房間)

```json
{
  "type": "join",
  "payload": {
    "roomId": "<房間ID>",
    "peerId": "<對等方ID>"
  }
}
```

#### 5.3.2 LEAVE (離開房間)

```json
{
  "type": "leave",
  "payload": {
    "roomId": "<房間ID>",
    "peerId": "<對等方ID>"
  }
}
```

#### 5.3.3 ROOM_STATE (房間狀態)

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

#### 5.3.4 PLAYER_JOINED (玩家加入)

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

#### 5.3.5 PLAYER_LEFT (玩家離開)

```json
{
  "type": "player-left",
  "payload": {
    "peerId": "<對等方ID>",
    "roomId": "<房間ID>"
  }
}
```

### 5.4 WebRTC 信令訊息

#### 5.4.1 OFFER (連接提議)

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

#### 5.4.2 ANSWER (連接應答)

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

#### 5.4.3 ICE_CANDIDATE (網絡候選項)

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

### 5.5 連接狀態訊息

#### 5.5.1 CONNECTION_STATE (連接狀態)

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

#### 5.5.2 RECONNECT_REQUEST (重連請求)

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

### 5.6 備援模式訊息

#### 5.6.1 FALLBACK_ACTIVATE (啟用備援)

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

#### 5.6.2 RELAY_DATA (中繼數據)

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

## 6. WebRTC P2P 數據通道

### 6.1 數據通道類型

| 通道名稱 | 用途 | 可靠性設置 |
|--------|------|----------|
| control | 控制消息和心跳檢測 | 可靠, ordered |
| chat | 文本聊天消息 | 可靠, ordered |
| state | 狀態同步 | 可靠, ordered |
| audio | 音頻數據包 | 不可靠, unordered |
| media | 其他媒體流 | 部分可靠 |

### 6.2 每個通道的消息格式

#### 6.2.1 control 通道

```json
{
  "type": "ping",
  "timestamp": 1650000000000
}
```

```json
{
  "type": "pong",
  "timestamp": 1650000000000,
  "latency": 15
}
```

```json
{
  "type": "ready",
  "peerId": "<對等方ID>"
}
```

#### 6.2.2 chat 通道

```json
{
  "type": "message",
  "from": "<發送方ID>",
  "content": "你好，大家好！",
  "timestamp": 1650000000000
}
```

#### 6.2.3 state 通道

```json
{
  "type": "update",
  "entityId": "<實體ID>",
  "properties": {
    "position": {"x": 100, "y": 200},
    "status": "active"
  },
  "timestamp": 1650000000000,
  "sequence": 42
}
```

```json
{
  "type": "delta",
  "updates": [
    {"entityId": "entity1", "property": "position.x", "value": 105},
    {"entityId": "entity2", "property": "status", "value": "inactive"}
  ],
  "timestamp": 1650000000000,
  "sequence": 43
}
```

## 7. 錯誤處理

### 7.1 REST API 錯誤響應

```json
{
  "success": false,
  "error": {
    "code": "ROOM_NOT_FOUND",
    "message": "The requested room does not exist",
    "details": {
      "roomId": "<查詢的房間ID>"
    }
  }
}
```

### 7.2 WebSocket 錯誤消息

```json
{
  "type": "error",
  "payload": {
    "code": "PERMISSION_DENIED",
    "message": "You don't have permission to perform this action",
    "details": {
      "action": "update-rules",
      "roomId": "<房間ID>"
    }
  }
}
```

### 7.3 常見錯誤代碼

| 錯誤代碼 | 描述 | HTTP 狀態碼 |
|---------|------|------------|
| ROOM_NOT_FOUND | 房間不存在 | 404 |
| ROOM_FULL | 房間已滿 | 403 |
| INVALID_PARAMETERS | 參數無效 | 400 |
| PERMISSION_DENIED | 權限不足 | 403 |
| ALREADY_IN_ROOM | 已經在房間中 | 409 |
| CONNECTION_ERROR | 連接錯誤 | N/A |
| ICE_FAILURE | ICE 連接失敗 | N/A |
| INTERNAL_ERROR | 內部服務器錯誤 | 500 |

## 8. 安全考量

### 8.1 認證與授權

1. **REST API 安全**:
   - 使用標準的身份驗證方式 (如 JWT)
   - 權限檢查：特定操作（如關閉房間）僅允許房主執行

2. **WebSocket 連接安全**:
   - 連接時需要驗證 token
   - 訊息源驗證：確保發送方身份真實
   - 防止未授權的房間訪問

### 8.2 數據安全

1. **數據傳輸加密**:
   - WebRTC 使用 DTLS/SRTP 加密
   - WebSocket 連接使用 WSS (WebSocket Secure)
   - REST API 使用 HTTPS

2. **敏感數據保護**:
   - 不通過公開通道傳輸認證信息
   - 敏感數據在應用層額外加密

## 9. 效能與可擴展性

### 9.1 負載均衡

1. **分區 (Sharding)**:
   - 按房間 ID 哈希進行分區
   - 不同的房間可位於不同的服務器節點

2. **水平擴展**:
   - 無狀態 REST API 服務
   - WebSocket 服務使用共享房間狀態

### 9.2 資源限制

1. **連接限制**:
   - 每個房間最大連接數
   - 每個客戶端最大連接數

2. **頻率限制**:
   - API 請求限制
   - WebSocket 消息頻率限制

## 10. 測試與驗證

### 10.1 測試方法

1. **單元測試**:
   - API 端點測試
   - 訊息處理邏輯測試

2. **集成測試**:
   - 完整房間生命週期測試
   - 信令交換測試

3. **壓力測試**:
   - 高並發連接測試
   - 大量數據交換測試

### 10.2 驗證清單

- [ ] REST API 全功能測試
- [ ] WebSocket 連接與消息傳遞測試
- [ ] WebRTC 信令交換測試
- [ ] P2P 連接建立測試
- [ ] 錯誤處理與恢復測試
- [ ] 高可用性與負載測試
- [ ] 安全性測試

## 11. 實現說明

後端實現此協議需要以下組件:

1. **HTTP 服務器**:
   - 處理 REST API 請求
   - 實現房間管理邏輯

2. **WebSocket 服務器**:
   - 處理 WebSocket 連接
   - 管理房間成員
   - 轉發信令消息

3. **狀態管理**:
   - 維護活動房間列表
   - 跟蹤房間成員

4. **備援服務**:
   - 處理 P2P 連接失敗的數據中繼
   - 實現 TURN 服務支持

5. **監控與日誌**:
   - 記錄關鍵事件
   - 監控服務健康狀態

## 附錄: WebRTC 配置

### STUN/TURN 服務器配置建議

```json
{
  "iceServers": [
    {
      "urls": ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"]
    },
    {
      "urls": ["turn:turn.echlub.com:3478"],
      "username": "echlub",
      "credential": "echlubauth"
    }
  ],
  "iceCandidatePoolSize": 10
}
``` 