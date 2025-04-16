# ECHLUB 前端架構概述

## 整體架構

ECHLUB 前端採用模組化的領域驅動設計（DDD）架構，每個 Bounded Context 都是一個完全獨立的模組。

## 核心原則

1. **模組獨立性**
   - 每個模組都是自治的單元
   - 擁有完整的分層架構
   - 可獨立開發、測試和部署

2. **清晰的邊界**
   - 模組間通過明確的契約通訊
   - 使用整合事件進行跨模組通訊
   - 避免直接依賴

3. **分層架構**
   每個模組包含四個主要層：
   - Application Layer（應用層）：處理用例和業務流程
   - Domain Layer（領域層）：核心業務邏輯和規則
   - Infrastructure Layer（基礎設施層）：技術實現和外部整合
   - Integration Layer（整合層）：處理模組間通訊

## 主要模組

1. **User Module**
   - 用戶管理
   - 身份驗證
   - 權限控制

2. **Room Module**
   - 房間管理
   - 成員管理
   - 房間設置

3. **Session Module**
   - 會話控制
   - 角色分配
   - 狀態同步

4. **Clip Module**
   - 音頻片段管理
   - 編輯操作
   - 效果處理

5. **Round Module**
   - 回合控制
   - 投票管理
   - 結果統計

6. **Render Module**
   - 音頻渲染
   - 匯出管理
   - 進度追蹤 