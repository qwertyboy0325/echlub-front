# 開發名詞表

## 架構相關

### 分層架構

- **表現層（Presentation Layer）**：處理用戶界面和交互
- **領域層（Domain Layer）**：包含核心業務邏輯
- **數據層（Data Layer）**：處理數據存儲和訪問
- **基礎設施層（Infrastructure Layer）**：提供技術支持服務

### 設計模式

- **工廠模式（Factory Pattern）**：用於創建對象的設計模式
- **依賴注入（Dependency Injection）**：一種實現控制反轉的設計模式
- **觀察者模式（Observer Pattern）**：用於實現事件驅動編程
- **單例模式（Singleton Pattern）**：確保類只有一個實例
- **DTO (Data Transfer Object)**：用於在不同層之間傳輸數據的對象，只包含數據屬性，不包含業務邏輯，用於解耦數據傳輸和業務邏輯
- **Mapper**：負責在不同層之間轉換數據格式，將 DTO 轉換為領域模型，將領域模型轉換為 DTO，處理數據格式轉換和默認值
- **Repository**：封裝數據訪問邏輯，提供統一的數據操作接口，實現數據持久化

## 技術實現

### 前端技術

- **TypeScript**：JavaScript 的超集，添加了靜態類型
- **PixiJS**：2D WebGL 渲染引擎
- **Web Audio API**：瀏覽器音頻處理 API

### 數據處理

- **UUID**：通用唯一標識符
- **JSON**：JavaScript 對象表示法
- **Buffer**：二進制數據緩衝區
- **序列化**：將對象轉換為可存儲格式
- **反序列化**：將存儲格式轉換為對象
- **數據映射**：在不同格式間轉換數據

### 性能相關

- **WebGL**：Web 圖形庫
- **Web Workers**：後台線程處理
- **RequestAnimationFrame**：動畫幀控制

## 開發工具

### 版本控制

- **Git**：分佈式版本控制系統
- **GitHub Actions**：自動化工作流程
- **Semantic Versioning**：語義化版本控制
- **分支管理**：管理代碼版本
- **合併策略**：處理代碼合併
- **衝突解決**：處理版本衝突

### 測試工具

- **Jest**：JavaScript 測試框架
- **TypeScript**：類型檢查
- **ESLint**：代碼質量檢查
- **單元測試**：測試獨立組件
- **整合測試**：測試組件交互
- **端到端測試**：測試完整流程

### 構建工具

- **Webpack**：模塊打包器
- **Babel**：JavaScript 轉譯器
- **TypeScript Compiler**：TypeScript 編譯器

## 開發流程

### 代碼質量

- **Linting**：代碼靜態分析
- **Code Coverage**：代碼覆蓋率
- **Code Review**：代碼審查

### 部署相關

- **CI/CD**：持續集成/持續部署
- **Docker**：容器化部署
- **NPM**：Node.js 包管理器

## 性能優化

### 渲染優化

- **Sprite Batching**：精靈批處理
- **Texture Atlas**：紋理圖集
- **Object Pooling**：對象池

### 內存管理

- **Garbage Collection**：垃圾回收
- **Memory Leak**：內存洩漏
- **Reference Counting**：引用計數

### 狀態管理

- **狀態存儲**：保存應用狀態
- **狀態更新**：修改應用狀態
- **狀態同步**：確保狀態一致性

### 事件處理

- **事件發送**：觸發事件
- **事件監聽**：處理事件
- **事件傳播**：事件在層間傳遞

### 緩存策略

- **數據緩存**：緩存常用數據
- **結果緩存**：緩存計算結果
- **緩存失效**：更新緩存數據

### 資源管理

- **記憶體管理**：控制記憶體使用
- **資源釋放**：釋放不再使用的資源
- **資源池**：重用資源對象

### 性能監控

- **FPS**：每秒幀數
- **Memory Usage**：內存使用
- **CPU Usage**：CPU 使用
- **性能指標**：測量系統性能
- **性能分析**：分析性能瓶頸
- **性能優化**：改進系統性能

## 安全相關

### 數據安全

- **Encryption**：加密
- **Authentication**：身份驗證
- **Authorization**：授權

### 網絡安全

- **HTTPS**：安全超文本傳輸協議
- **CORS**：跨源資源共享
- **XSS**：跨站腳本攻擊

## 監控和調試

### 性能監控

- **FPS**：每秒幀數
- **Memory Usage**：內存使用
- **CPU Usage**：CPU 使用

### 錯誤處理

- **Error Tracking**：錯誤追蹤
- **Logging**：日誌記錄
- **Debugging**：調試

# 技術術語表

## 架構相關術語

### 依賴注入（Dependency Injection）
- **Container**：依賴注入容器，負責管理所有服務的實例
- **Injectable**：可注入的服務，使用 `@injectable()` 裝飾器標記
- **Binding**：服務綁定，定義服務的實現和生命週期
- **Scope**：服務作用域，包括 Singleton、Transient 等

### 事件系統（Event System）
- **EventBus**：事件總線，負責事件的發布和訂閱
- **EventTranslator**：事件轉換器，處理不同層級間的事件轉換
- **EventFilter**：事件過濾器，過濾不需要處理的事件
- **EventHandler**：事件處理器，處理具體的事件邏輯

### 狀態管理（State Management）
- **StateStore**：狀態存儲，保存應用的狀態數據
- **StateSlice**：狀態切片，將狀態分割為可管理的部分
- **StateManager**：狀態管理器，處理狀態的讀寫操作
- **StatePersistence**：狀態持久化，將狀態保存到存儲設備

## 音頻處理術語

### 音頻引擎（Audio Engine）
- **AudioContext**：Web Audio API 的核心對象
- **AudioNode**：音頻處理節點，如 GainNode、DelayNode 等
- **AudioBuffer**：音頻緩衝區，存儲音頻數據
- **AudioWorklet**：音頻工作線程，處理複雜的音頻運算

### 音頻處理（Audio Processing）
- **Sample Rate**：採樣率，每秒採樣次數
- **Buffer Size**：緩衝區大小，影響延遲和性能
- **Latency**：延遲，從輸入到輸出的時間差
- **DSP**：數字信號處理，音頻處理的核心技術

## UI 相關術語

### 渲染系統（Rendering System）
- **PixiJS**：2D 渲染引擎，用於音頻可視化
- **Container**：顯示對象容器，管理顯示層級
- **Sprite**：精靈圖，基本的顯示對象
- **Stage**：舞台，渲染的根容器

### React 組件（React Components）
- **Functional Component**：函數式組件，主要的組件類型
- **Hook**：鉤子函數，處理組件的狀態和副作用
- **Props**：屬性，組件間的數據傳遞
- **State**：狀態，組件內部的數據管理

## 性能優化術語

### 渲染優化（Rendering Optimization）
- **Virtual List**：虛擬列表，優化長列表渲染
- **Frame Rate**：幀率，每秒渲染次數
- **GPU Acceleration**：GPU 加速，使用硬件加速渲染
- **Batch Processing**：批處理，合併多個操作

### 音頻優化（Audio Optimization）
- **Audio Buffer Pool**：音頻緩衝池，重用音頻緩衝區
- **Zero Copy**：零拷貝，避免不必要的數據複製
- **Real-time Processing**：實時處理，保證音頻處理的即時性
- **Worklet Threading**：工作線程，避免阻塞主線程

## 開發工具術語

### 版本控制（Version Control）
- **Git**：分佈式版本控制系統
- **Branch**：分支，並行開發的基礎
- **Commit**：提交，代碼變更的基本單位
- **Pull Request**：合併請求，代碼審查的基礎

### 開發環境（Development Environment）
- **Node.js**：JavaScript 運行時環境
- **TypeScript**：JavaScript 的超集，添加類型系統
- **Webpack**：模塊打包工具
- **ESLint**：代碼質量檢查工具

## 測試相關術語

### 測試類型（Test Types）
- **Unit Test**：單元測試，測試最小的功能單元
- **Integration Test**：集成測試，測試多個單元的協作
- **E2E Test**：端到端測試，測試完整的用戶流程
- **Performance Test**：性能測試，測試系統性能指標

### 測試工具（Test Tools）
- **Jest**：JavaScript 測試框架
- **React Testing Library**：React 組件測試工具
- **Cypress**：端到端測試工具
- **Lighthouse**：性能測試工具

## 監控和調試術語

### 監控系統（Monitoring System）
- **Metrics**：指標，系統運行的各項數據
- **Logging**：日誌，記錄系統運行狀態
- **Tracing**：追蹤，記錄請求的完整路徑
- **Alerting**：告警，異常情況的通知機制

### 調試工具（Debug Tools）
- **Chrome DevTools**：Chrome 開發者工具
- **React DevTools**：React 調試工具
- **Web Audio Debug**：Web Audio API 調試工具
- **Performance Monitor**：性能監控工具

## 參考資料

- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [React 術語表](https://reactjs.org/docs/glossary.html)
- [TypeScript 手冊](https://www.typescriptlang.org/docs/)
- [PixiJS API 文檔](https://pixijs.download/release/docs/index.html)
