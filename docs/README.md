# 📚 EchLub Frontend 文檔索引

歡迎來到 EchLub Frontend 專案文檔中心。本文檔提供所有專案文件的結構化導覽。

## 🗂️ 文檔結構

### 📖 核心文檔
- [專案說明](../README.md) - 專案概述、安裝與使用指南
- [架構概覽](architecture/README.md) - 整體架構說明

### 🏗️ 架構設計
- [架構改進計劃](architecture/architecture-improvement-plan.md) - 🔥 架構分析與改進路線圖
- [戰略架構分析](architecture/strategic-analysis.md) - 🔥 深度技術與戰略評估
- [分層架構](architecture/layered-architecture.md) - Clean Architecture 實現
- [領域設計](architecture/domain-layer.md) - 領域層設計原則
- [應用層](architecture/application-layer.md) - 應用層實現指南
- [依賴注入](architecture/dependency-injection.md) - IoC 容器配置
- [事件系統](architecture/event-system.md) - 事件溯源實現
- [狀態管理](architecture/state-management.md) - 應用狀態管理策略

### 🎵 核心模組文檔
- [音樂編排 BC](jam-session-core-types.md) - 核心類型定義
- [音樂編排實現指南](jam-session-implementation-guide.md) - 詳細實現說明
- [協作模組設計](collaboration-module-design.md) - 協作功能設計
- [WebRTC 信令協議](WebRTC-Signaling-Protocol-Spec.md) - 信令協議規範
- [協作協議規範](Collaboration-Protocol-Specification.md) - 協作協議定義

### 🧪 測試與品質
- [整合測試](integration-testing.md) - 整合測試指南
- [協作整合測試](Collaboration-Integration-Tests.md) - 協作功能測試
- [壓力測試指南](STRESS_TEST_GUIDE.md) - 效能壓力測試
- [BMP 測試指南](BMP_TEST_GUIDE.md) - BMP 格式測試

### ⚡ 效能優化
- [效能優化總結](PERFORMANCE_OPTIMIZATION_SUMMARY.md) - 效能優化方案

### 🛠️ 開發指南
- [開發指南](architecture/development-guide.md) - 開發流程與規範
- [重構指南](architecture/refactoring-guide.md) - 代碼重構指南
- [技術術語](architecture/technical-terms.md) - 專案技術術語表
- [開發工具](../tools/README.md) - 開發工具與腳本

### 📁 模組特定文檔

- [UI 文檔](ui/) - 使用者介面相關文檔
- [音樂編排詳細文檔](bounded-contexts/music-arrangement/) - 音樂編排模組詳細文檔

## 🏷️ 文檔標籤系統

### 按狀態分類
- ✅ **完成** - 文檔內容完整且最新
- 🚧 **開發中** - 文檔正在更新中
- ⚠️ **需要更新** - 文檔可能過時需要檢查
- 🗑️ **待清理** - 文檔待刪除或合併

### 按重要性分類
- 🔥 **核心** - 專案核心概念，必讀
- 📖 **重要** - 開發必需了解的內容
- 📝 **參考** - 參考資料和詳細規範
- 🔧 **工具** - 開發工具和輔助文檔

## 📋 文檔維護

### 更新頻率
- **核心文檔**：隨著架構變更即時更新
- **API 文檔**：隨著代碼變更同步更新
- **指南文檔**：定期檢查和更新

### 貢獻指南
1. 新增文檔請更新此索引
2. 保持文檔結構一致性
3. 使用清晰的標題和分類
4. 添加適當的交叉引用

## 🔍 快速導覽

### 新開發者入門
1. 閱讀 [專案說明](../README.md)
2. 了解 [架構概覽](architecture/README.md)
3. 查看 [開發指南](architecture/development-guide.md)

### 架構理解
1. [分層架構](architecture/layered-architecture.md)
2. [領域設計](architecture/domain-layer.md)
3. [模組間通訊](architecture/cross-bc-communication.md)

### 功能開發
1. 選擇相關的 BC 文檔
2. 查看實現指南
3. 參考測試文檔

---

**最後更新**：2024-01-XX  
**維護者**：開發團隊 