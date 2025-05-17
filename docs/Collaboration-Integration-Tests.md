# Echlub 協作模組整合測試規格

## 1. 整合測試概述

本文檔定義了 Echlub 協作模組的整合測試範圍與測試案例，確保前後端交互符合協議規格，能正確處理各種場景與邊界條件。整合測試專注於驗證系統模組間的交互，確保端到端流程的正確性。

## 2. 測試環境設置

### 2.1 測試環境需求

- **後端服務**：
  - REST API 服務器
  - WebSocket 信令服務器
  - STUN/TURN 服務器 (可選用公共服務)

- **測試客戶端**：
  - 自動化測試客戶端（使用 Playwright 或類似工具）
  - 手動測試客戶端（可使用正常前端應用）
  - 測試監控工具（記錄網絡流量、訊息交換）

### 2.2 前端測試配置

```typescript
// 測試配置
const testConfig = {
  apiUrl: 'http://localhost:3000/api',
  wsUrl: 'ws://localhost:3000/collaboration',
  iceServers: [
    { urls: ['stun:stun.l.google.com:19302'] },
    {
      urls: ['turn:localhost:3478'],
      username: 'test',
      credential: 'test123'
    }
  ],
  logLevel: 'debug'
};
```

### 2.3 模擬延遲與不穩定網絡

- 使用網絡代理工具模擬網絡延遲
- 模擬網絡斷開和重連場景
- 模擬 NAT 限制與防火牆阻擋

## 3. 核心測試案例

### 3.1 房間生命週期測試

#### TC-RL-001: 房間創建與加入流程

**目的**：驗證完整的房間創建、加入與資料交換流程

**測試步驟**：
1. 客戶端A通過REST API創建新房間
2. 客戶端A連接WebSocket服務器並加入房間
3. 客戶端B查詢可用房間列表
4. 客戶端B加入客戶端A創建的房間
5. 驗證雙方收到玩家加入通知
6. 客戶端A和B交換WebRTC信令並建立P2P連接
7. 客戶端間交換測試數據
8. 客戶端A離開房間
9. 驗證客戶端B收到玩家離開通知
10. 客戶端B關閉房間

**預期結果**：
- 所有API響應狀態碼為200
- 客戶端A成功創建並加入房間
- 客戶端B能看到並加入房間
- 雙方成功建立P2P連接並交換數據
- 房間狀態變更正確傳播到相關客戶端
- 房間正確關閉且從列表中移除

**測試數據**：
```typescript
// 測試房間資料
const testRoom = {
  name: "整合測試房間",
  description: "用於整合測試的房間",
  maxPlayers: 4,
  allowRelay: true,
  latencyTargetMs: 100,
  opusBitrate: 32000
};

// 測試訊息
const testMessage = {
  type: "text",
  content: "這是測試訊息",
  timestamp: Date.now()
};
```

#### TC-RL-002: 房間多人互動測試

**目的**：測試多個客戶端同時加入房間並互動

**測試步驟**：
1. 客戶端A創建新房間
2. 客戶端B, C, D依次加入房間
3. 每個客戶端與其他客戶端建立P2P連接
4. 所有客戶端互相發送測試訊息
5. 隨機讓一個客戶端離開房間
6. 驗證剩餘客戶端收到離開通知
7. 剩餘客戶端繼續互發訊息
8. 房主關閉房間
9. 驗證所有客戶端收到房間關閉通知

**預期結果**：
- 所有客戶端能成功加入房間
- 全網格拓撲成功建立 (N*(N-1)/2 個連接)
- 所有訊息正確發送和接收
- 玩家離開事件正確傳播
- 房間關閉事件正確傳播

### 3.2 信令交換測試

#### TC-SG-001: WebRTC信令完整交換測試

**目的**：驗證WebRTC連接建立過程中所有信令的正確交換

**測試步驟**：
1. 客戶端A和B加入同一房間
2. 捕獲並記錄所有信令訊息：
   - 連接提議 (OFFER)
   - 連接應答 (ANSWER)
   - ICE候選項 (ICE_CANDIDATE)
3. 驗證訊息格式與內容
4. 驗證P2P連接是否成功建立
5. 驗證連接狀態變更通知

**預期結果**：
- OFFER訊息正確發送和接收
- ANSWER訊息正確發送和接收
- ICE候選項正確交換
- 連接狀態從"connecting"變為"connected"
- 數據通道成功建立

**驗證點**：
```typescript
// 檢查SDP是否包含必要欄位
function validateSdp(sdp: string): boolean {
  return sdp.includes('a=ice-pwd:') && 
         sdp.includes('a=fingerprint:') && 
         sdp.includes('a=setup:');
}

// 檢查ICE候選項格式
function validateIceCandidate(candidate: RTCIceCandidateInit): boolean {
  return candidate.candidate !== null && 
         candidate.sdpMid !== null &&
         typeof candidate.sdpMLineIndex === 'number';
}
```

#### TC-SG-002: 信令重傳與失敗恢復測試

**目的**：測試信令傳輸失敗和重試機制

**測試步驟**：
1. 設置網絡代理模擬信令丟失
2. 客戶端A和B嘗試建立連接
3. 強制丟棄部分信令訊息
4. 觀察重試行為
5. 恢復網絡連接
6. 驗證連接最終是否建立成功

**預期結果**：
- 系統檢測到信令丟失
- 自動重試發送失敗的信令
- 連接最終成功建立
- 連接狀態變更事件順序正確

### 3.3 P2P連接測試

#### TC-P2P-001: 數據通道建立與通訊測試

**目的**：驗證WebRTC數據通道的建立與雙向通訊

**測試步驟**：
1. 客戶端A和B建立WebRTC連接
2. 創建並開啟多個數據通道：
   - control通道
   - chat通道
   - state通道
3. 客戶端A通過各通道發送測試數據
4. 客戶端B驗證接收到的數據
5. 客戶端B回傳確認訊息
6. 測試大量數據傳輸

**預期結果**：
- 所有數據通道成功建立
- 數據正確傳輸和接收
- 傳輸速度符合預期
- 無數據丟失或損壞

**測試數據**：
```typescript
// 測試通道狀態同步數據
const stateUpdateData = {
  type: "update",
  entityId: "test-entity-1",
  properties: {
    position: { x: 123.45, y: 67.89 },
    rotation: 45.6,
    status: "active"
  },
  timestamp: Date.now(),
  sequence: 1
};

// 大量數據測試
function generateLargeData(sizeKB: number): ArrayBuffer {
  return new ArrayBuffer(sizeKB * 1024);
}
```

#### TC-P2P-002: 連接斷開與重連測試

**目的**：測試WebRTC連接斷開與自動重連機制

**測試步驟**：
1. 客戶端A和B建立P2P連接
2. 驗證初始連接正常工作
3. 模擬網絡中斷情況
4. 觀察連接狀態變更
5. 驗證重連請求發送
6. 恢復網絡連接
7. 驗證連接自動恢復
8. 測試恢復後的數據傳輸

**預期結果**：
- 檢測到連接中斷
- 發送RECONNECT_REQUEST訊息
- 連接成功重新建立
- 恢復通訊且無數據丟失

### 3.4 備援與降級測試

#### TC-FB-001: WebRTC降級至備援模式測試

**目的**：驗證當P2P連接無法建立時的備援機制

**測試步驟**：
1. 模擬無法穿透NAT的環境（阻斷直接P2P連接）
2. 客戶端A和B嘗試建立WebRTC連接
3. 觀察多次連接嘗試後系統啟動備援模式
4. 驗證FALLBACK_ACTIVATE訊息交換
5. 測試通過WebSocket中繼的數據傳輸

**預期結果**：
- 系統檢測到P2P連接失敗
- 自動啟動備援模式
- 連接狀態變更為"fallback"
- 數據通過服務器中繼傳輸
- 應用層邏輯正常運作

#### TC-FB-002: TURN服務器中繼測試

**目的**：測試使用TURN服務器中繼的場景

**測試步驟**：
1. 配置環境使用TURN服務
2. 模擬客戶端位於嚴格防火牆後
3. 客戶端A和B建立連接
4. 捕獲ICE候選項，確認使用TURN候選項
5. 測試通過TURN中繼的數據傳輸效能

**預期結果**：
- ICE連接使用TURN候選項
- 連接狀態變更為"relaying"
- 數據成功通過TURN服務器中繼
- 延遲在可接受範圍內

### 3.5 房間管理測試

#### TC-RM-001: 房間規則更新測試

**目的**：驗證房間規則更新與通知機制

**測試步驟**：
1. 客戶端A創建房間並設置初始規則
2. 客戶端B和C加入房間
3. 客戶端A更新房間規則
4. 驗證B和C接收到規則更新通知
5. 測試新規則是否生效

**預期結果**：
- 規則更新API返回成功
- 所有成員收到規則變更通知
- 新規則在所有客戶端生效

**測試數據**：
```typescript
// 初始規則
const initialRules = {
  maxPlayers: 4,
  allowRelay: true,
  latencyTargetMs: 100,
  opusBitrate: 32000
};

// 更新規則
const updatedRules = {
  maxPlayers: 6,
  allowRelay: false,
  latencyTargetMs: 150,
  opusBitrate: 24000
};
```

#### TC-RM-002: 房間容量與限制測試

**目的**：測試房間容量限制和相關錯誤處理

**測試步驟**：
1. 客戶端A創建設置為最大2人的房間
2. 客戶端A和B加入房間
3. 客戶端C嘗試加入房間
4. 驗證C收到適當的錯誤響應
5. 客戶端B離開房間
6. 客戶端C再次嘗試加入房間
7. 驗證C能成功加入

**預期結果**：
- 當房間已滿時，拒絕新成員加入
- 返回適當的錯誤代碼 (ROOM_FULL)
- 當有空位時，允許新成員加入

## 4. 錯誤場景測試

### 4.1 無效請求處理

#### TC-ER-001: 無效API請求測試

**目的**：驗證系統對無效API請求的處理

**測試場景**：
1. 請求不存在的房間
2. 使用無效房間ID格式
3. 提供不完整的請求參數
4. 提供格式錯誤的JSON
5. 非房主嘗試更新房間規則

**預期結果**：
- 返回適當的HTTP狀態碼
- 返回結構化錯誤訊息
- 錯誤代碼與描述清晰明確

**測試數據**：
```typescript
// 無效的房間ID
const invalidRoomId = "not-a-valid-uuid";

// 不完整的請求參數
const incompleteRoomCreate = {
  name: "測試房間"
  // 缺少必要參數
};

// 格式錯誤的JSON
const invalidJson = "{name: 測試房間}";
```

#### TC-ER-002: 無效WebSocket訊息測試

**目的**：驗證系統對無效WebSocket訊息的處理

**測試場景**：
1. 發送格式錯誤的訊息
2. 發送缺少必要欄位的訊息
3. 發送包含無效類型的訊息
4. 向錯誤的目標發送訊息

**預期結果**：
- 回傳適當的錯誤訊息
- 不影響現有的連接狀態
- 記錄錯誤日誌

### 4.2 異常場景處理

#### TC-EX-001: WebSocket連接中斷測試

**目的**：測試WebSocket連接中斷與重連機制

**測試步驟**：
1. 客戶端A和B建立連接
2. 強制關閉客戶端A的WebSocket連接
3. 觀察自動重連行為
4. 驗證重連後房間狀態恢復
5. 測試P2P連接是否維持

**預期結果**：
- 檢測到WebSocket連接中斷
- 自動嘗試重連，最多5次
- 重連後重新加入房間
- 保持或重建P2P連接
- UI適當顯示連接狀態

#### TC-EX-002: 權限錯誤處理測試

**目的**：測試權限錯誤場景

**測試步驟**：
1. 客戶端A創建房間
2. 客戶端B加入房間
3. 客戶端B嘗試關閉房間
4. 驗證適當的權限錯誤響應
5. 客戶端B嘗試更新房間規則
6. 驗證權限錯誤處理

**預期結果**：
- 非房主操作被拒絕
- 返回PERMISSION_DENIED錯誤代碼
- 錯誤訊息清晰描述問題

## 5. 效能測試

### 5.1 連接建立性能

#### TC-PF-001: 連接建立時間測試

**目的**：測量WebRTC連接建立所需時間

**測試步驟**：
1. 記錄開始時間
2. 客戶端A和B建立WebRTC連接
3. 記錄連接成功時間
4. 計算連接建立延遲
5. 在不同網絡條件下重複測試

**預期結果**：
- 良好網絡下連接時間 < 1秒
- 受限網絡下連接時間 < 5秒
- 95%的連接嘗試能在10秒內完成

**性能指標**：
```typescript
// 連接時間測量
interface ConnectionMetrics {
  startTime: number;       // 開始連接時間
  offerCreatedTime: number; // 創建offer時間
  answerReceivedTime: number; // 接收answer時間
  iceGatheringTime: number; // ICE收集時間
  connectionEstablishedTime: number; // 連接建立時間
  totalTime: number;       // 總耗時
}
```

### 5.2 數據傳輸性能

#### TC-PF-002: 數據吞吐量測試

**目的**：測試WebRTC數據通道的吞吐量

**測試步驟**：
1. 客戶端A和B建立P2P連接
2. 客戶端A發送大量測試數據
3. 測量數據傳輸速率
4. 測量延遲和抖動
5. 在不同負載下重複測試

**預期結果**：
- 數據傳輸速率 > 1MB/s
- 延遲 < 100ms
- 抖動 < 50ms

### 5.3 高並發測試

#### TC-PF-003: 多房間並發測試

**目的**：測試系統處理多個同時活躍房間的能力

**測試步驟**：
1. 創建多個房間 (10-100個)
2. 每個房間加入多個客戶端 (2-8個)
3. 所有房間同時進行數據交換
4. 監控系統資源使用
5. 測量信令服務器負載

**預期結果**：
- 系統能同時處理至少50個活躍房間
- 每個房間的服務質量保持一致
- 服務器資源使用在可接受範圍內

## 6. 兼容性測試

### 6.1 瀏覽器兼容性

#### TC-CP-001: 跨瀏覽器相容性測試

**目的**：驗證系統在不同瀏覽器間的相容性

**測試環境**：
- Google Chrome (最新版)
- Mozilla Firefox (最新版)
- Microsoft Edge (最新版)
- Safari (最新版)

**測試步驟**：
1. 在不同瀏覽器組合間建立P2P連接
2. 測試所有功能正常運作
3. 特別關注SDP格式差異處理
4. 測試ICE候選項收集與處理

**預期結果**：
- 所有主流瀏覽器間能成功建立連接
- 數據正確傳輸且無兼容性問題
- UI正確呈現連接狀態

### 6.2 網絡環境相容性

#### TC-CP-002: 網絡環境相容性測試

**目的**：測試不同網絡環境下的連接成功率

**測試環境**：
- 對稱NAT後的客戶端
- 企業防火牆環境
- 移動網絡 (4G/5G)
- 高延遲環境 (>200ms)
- 網絡切換場景 (Wi-Fi到移動網絡)

**預期結果**：
- 在各種受限網絡下能建立連接
- 適當時自動降級至TURN或備援模式
- 處理網絡切換且恢復連接

## 7. 安全測試

### 7.1 認證與授權

#### TC-SC-001: 認證與授權測試

**目的**：驗證系統的認證和授權機制

**測試步驟**：
1. 嘗試未認證訪問API端點
2. 使用過期或無效的token
3. 使用權限不足的帳號執行操作
4. 測試跨房間操作限制

**預期結果**：
- 未授權請求被拒絕
- 返回適當的401/403狀態碼
- 權限控制正確實施

### 7.2 數據安全

#### TC-SC-002: 數據加密測試

**目的**：驗證敏感數據的加密機制

**測試步驟**：
1. 抓取WebRTC數據包分析
2. 驗證使用DTLS加密
3. 檢查SDP中的安全參數
4. 測試應用層敏感數據保護

**預期結果**：
- WebRTC流量正確加密
- 無法解密捕獲的數據包
- 敏感數據得到額外保護

## 8. 測試優先級與執行計劃

### 8.1 測試優先級

| 測試ID | 優先級 | 執行頻率 | 自動化 |
|--------|-------|----------|-------|
| TC-RL-001 | 高 | 每次部署 | 是 |
| TC-SG-001 | 高 | 每次部署 | 是 |
| TC-P2P-001 | 高 | 每次部署 | 是 |
| TC-FB-001 | 中 | 每週 | 是 |
| TC-RM-001 | 中 | 每週 | 是 |
| TC-ER-001 | 中 | 每週 | 是 |
| TC-EX-001 | 中 | 每週 | 是 |
| TC-PF-001 | 低 | 每月 | 否 |
| TC-CP-001 | 低 | 主要版本 | 否 |
| TC-SC-001 | 高 | 每次部署 | 是 |

### 8.2 執行計劃

1. **持續整合測試**：
   - 每次代碼提交運行核心測試
   - 包含TC-RL-001, TC-SG-001, TC-P2P-001, TC-SC-001

2. **每週回歸測試**：
   - 每週執行所有高優先級和中優先級測試
   - 監控關鍵性能指標

3. **版本發布測試**：
   - 主要版本發布前執行所有測試
   - 包含兼容性測試和性能測試

## 9. 自動化測試框架

### 9.1 推薦技術堆疊

- **測試框架**：Jest + Playwright
- **網絡分析**：Chrome DevTools Protocol
- **性能監控**：Prometheus + Grafana
- **負載生成**：k6

### 9.2 自動化測試示例

```typescript
// WebRTC 連接建立測試示例
test('兩客戶端可成功建立 WebRTC 連接', async () => {
  // 啟動兩個測試客戶端
  const clientA = await launchBrowser();
  const clientB = await launchBrowser();
  
  try {
    // 創建房間
    const roomId = await clientA.createRoom(testRoom);
    expect(roomId).toBeDefined();
    
    // 加入房間
    await clientA.joinRoom(roomId);
    await clientB.joinRoom(roomId);
    
    // 等待連接建立
    const connectedA = await clientA.waitForConnectionState('connected', 10000);
    const connectedB = await clientB.waitForConnectionState('connected', 10000);
    
    expect(connectedA).toBe(true);
    expect(connectedB).toBe(true);
    
    // 測試數據傳輸
    await clientA.sendMessage('test-channel', 'Hello from A');
    const message = await clientB.waitForMessage('test-channel', 5000);
    
    expect(message).toBe('Hello from A');
  } finally {
    // 清理資源
    await clientA.close();
    await clientB.close();
  }
});
```

## 10. 測試報告

### 10.1 報告格式

測試報告應包含以下內容：

1. **測試摘要**：
   - 執行的測試案例數量
   - 通過/失敗/阻塞的案例數
   - 關鍵問題摘要

2. **詳細測試結果**：
   - 每個測試案例的結果
   - 失敗案例的錯誤訊息和日誌
   - 截圖或錄像（對關鍵問題）

3. **性能指標**：
   - 連接建立時間統計
   - 數據傳輸性能統計
   - 資源使用情況

### 10.2 報告示例

```json
{
  "summary": {
    "version": "1.0.0",
    "date": "2023-08-15T14:30:00Z",
    "totalTests": 25,
    "passed": 22,
    "failed": 2,
    "skipped": 1,
    "duration": 1834.5
  },
  "results": [
    {
      "id": "TC-RL-001",
      "name": "房間創建與加入流程",
      "status": "passed",
      "duration": 4.82,
      "logs": []
    },
    {
      "id": "TC-SG-001",
      "name": "WebRTC信令完整交換測試",
      "status": "failed",
      "duration": 12.54,
      "error": "超時: 連接未在預期時間內建立",
      "logs": [
        "14:32:15 - 開始信令交換",
        "14:32:18 - 發送offer成功",
        "14:32:20 - 未收到answer",
        "14:32:25 - 連接建立超時"
      ]
    }
  ],
  "performance": {
    "connectionTime": {
      "avg": 2.34,
      "min": 0.95,
      "max": 8.73,
      "p95": 5.67
    },
    "dataTransfer": {
      "throughput": 1.45,
      "latency": 78.3,
      "jitter": 12.6
    }
  }
}
```

## 11. 問題跟踪與解決流程

1. **問題分類**：
   - 連接問題
   - 信令問題
   - 數據傳輸問題
   - 性能問題
   - 兼容性問題

2. **問題優先級**：
   - P0: 阻斷性問題，影響基本功能
   - P1: 嚴重問題，影響主要功能
   - P2: 中等問題，降低用戶體驗
   - P3: 輕微問題，有替代方案

3. **解決流程**：
   - 問題重現與記錄
   - 根本原因分析
   - 修復與驗證
   - 回歸測試 