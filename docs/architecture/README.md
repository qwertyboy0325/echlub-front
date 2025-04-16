# 🎯 ECHLUB DAW Clean Architecture 指南

本文件提供基於 Clean Architecture 的多人音樂共編系統架構指南。

## 📦 專案結構

```
src/
├── domain/                 // 領域層：核心業務邏輯
│   ├── user/              // User BC
│   │   ├── entities/
│   │   ├── events/
│   │   └── repositories/
│   ├── room/              // Room BC
│   │   ├── entities/
│   │   ├── events/
│   │   └── repositories/
│   ├── session/           // Session BC
│   │   ├── entities/
│   │   ├── events/
│   │   └── repositories/
│   ├── clip/              // Clip BC
│   │   ├── entities/
│   │   ├── events/
│   │   └── repositories/
│   ├── round/             // Round BC
│   │   ├── entities/
│   │   ├── events/
│   │   └── repositories/
│   └── render/            // Render BC
│       ├── entities/
│       ├── events/
│       └── repositories/
│
├── application/           // 應用層：用例協調
│   ├── user/
│   │   └── use-cases/
│   ├── room/
│   │   └── use-cases/
│   ├── session/
│   │   └── use-cases/
│   ├── clip/
│   │   └── use-cases/
│   ├── round/
│   │   └── use-cases/
│   └── render/
│       └── use-cases/
│
├── presentation/          // 表現層：UI 和狀態管理
│   ├── states/           // UI 狀態管理
│   │   ├── user/
│   │   ├── room/
│   │   ├── session/
│   │   ├── clip/
│   │   ├── round/
│   │   └── render/
│   ├── components/        // React 組件
│   │   ├── user/
│   │   ├── room/
│   │   ├── session/
│   │   ├── clip/
│   │   ├── round/
│   │   └── render/
│   └── pages/            // 頁面組件
│
└── infrastructure/        // 基礎設施層：技術實現
    ├── persistence/      // 資料持久化
    ├── audio/            // 音頻處理
    ├── websocket/        // 即時通訊
    ├── di/               // 依賴注入
    └── events/           // 事件總線
```

## 🔄 領域事件流

### User BC
- Events: UserRegistered, UserLoggedIn
- Commands: RegisterUser, LoginUser

### Room BC
- Events: RoomCreated, UserJoinedRoom, RoomFilled
- Commands: CreateRoom, JoinRoom, LeaveRoom

### Session BC
- Events: UserSelectedRole, AllUsersReady, DAWInitialized
- Commands: SelectRole, SelectInstrumentSet

### Clip BC
- Events: ClipAdded, ClipRecorded, ClipEdited
- Commands: AddClip, RecordClip, EditClip

### Round BC
- Events: RoundTerminationConsensusReached, RoundCompleted
- Commands: VoteToEndRound, CompleteRound

### Render BC
- Events: AudioRendered
- Commands: RenderAudio

## 🏗️ 架構原則

1. **Clean Architecture 分層**
   - Domain Layer：核心業務邏輯
   - Application Layer：用例協調
   - Presentation Layer：UI 和狀態
   - Infrastructure Layer：技術實現

2. **Bounded Context 原則**
   - 每個 BC 都是獨立的領域模組
   - BC 間通過事件進行通信
   - 每個 BC 維護自己的狀態和模型

3. **依賴規則**
   - 外層依賴內層
   - 依賴指向領域層
   - 通過接口實現依賴反轉

4. **狀態管理原則**
   - UI 狀態在 Presentation Layer
   - 業務狀態在 Domain Layer
   - 通過 Application Layer 協調

## 🚀 開發流程

1. 從領域層開始
   - 定義實體和值對象
   - 實現領域事件
   - 建立倉儲接口

2. 實現應用層
   - 編寫用例
   - 實現事件處理
   - 協調業務流程

3. 開發表現層
   - 設計 UI 組件
   - 實現狀態管理
   - 處理用戶交互

4. 完成基礎設施
   - 實現持久化
   - 配置事件總線
   - 整合外部服務

## 📋 待辦事項

- [ ] 完善各 BC 的領域模型
- [ ] 實現事件總線
- [ ] 建立狀態管理系統
- [ ] 整合音頻處理模組

## 📚 架構文件索引

### 核心架構
- [領域層架構](./domain-layer.md)：核心業務邏輯和實體定義
- [應用層架構](./application-layer.md)：用例和業務流程協調
- [接口層架構](./interface-layer.md)：使用者介面和外部通訊
- [基礎設施層架構](./infrastructure-layer.md)：技術實現和外部服務

### 領域設計
- [領域術語](./domain-terms.md)：業務領域中的關鍵概念和術語
- [領域事件](./domain-events.md)：系統中的關鍵事件定義
- [值對象](./value-objects.md)：不可變的值對象定義
- [聚合根](./aggregates.md)：實體和值對象的組合邊界

### 技術實現
- [狀態管理](./state-management.md)：應用狀態管理策略
- [事件系統](./event-system.md)：事件驅動架構實現
- [效能優化](./performance-optimization.md)：系統效能優化策略
- [音頻處理](./audio-processing.md)：音頻處理和播放實現
- [依賴注入](./dependency-injection.md)：依賴注入容器配置
- [PixiJS整合](./pixijs-integration.md)：視覺化引擎整合

### 開發指南
- [開發流程](./development-sequence.md)：開發步驟和最佳實踐
- [重構指南](./refactoring-guide.md)：代碼重構原則和方法
- [開發規範](./development-guide.md)：程式碼風格和開發規範

## 閱讀指南

### 1. 新手入門
1. 首先閱讀 [MVP 目標](./mvp-goals.md) 了解產品目標
2. 閱讀 [分層架構](./layered-architecture.md) 理解系統結構
3. 查看 [開發序列](./development-sequence.md) 了解開發流程
4. 參考 [技術術語](./technical-terms.md) 和 [領域術語](./domain-terms.md)

### 2. 開發指南
1. 遵循 [開發序列](./development-sequence.md) 進行開發
2. 參考 [依賴注入](./dependency-injection.md) 了解服務註冊
3. 使用 [事件系統](./event-system.md) 處理組件通信
4. 按照 [展示層](./presentation-layer.md) 實現 UI 組件

### 3. 性能優化
1. 參考 [性能優化](./performance-optimization.md) 進行優化
2. 遵循 [重構指南](./refactoring-guide.md) 改進代碼質量

## 文檔維護

### 1. 更新原則
- 及時更新文檔以反映最新的系統狀態
- 保持文檔的一致性和準確性
- 添加實際的代碼示例和使用場景
- 記錄重要的設計決策和變更原因

### 2. 文檔格式
- 使用 Markdown 格式編寫
- 包含清晰的標題和章節
- 提供代碼示例和圖表說明
- 添加相關文檔的鏈接

### 3. 質量要求
- 文檔內容準確完整
- 示例代碼可以運行
- 術語使用統一
- 結構清晰易懂

## 參考資料

- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [React 文檔](https://reactjs.org/docs/getting-started.html)
- [TypeScript 手冊](https://www.typescriptlang.org/docs/)
- [PixiJS 文檔](https://pixijs.download/release/docs/index.html)
