# 🛠️ 開發工具與腳本

本目錄包含 EchLub Frontend 專案的開發工具、測試腳本和實用程式。

## 📁 目錄結構

### `testing/`
測試相關的工具和腳본

- `test-daw-integration.js` - DAW 界面整合測試腳本
  - 用於在瀏覽器控制台中測試 DAW 界面功能
  - 檢查組件渲染、PIXI.js 初始化、互動元素等
  - 使用方法：在開發模式下打開瀏覽器控制台，複製貼上腳本內容

## 🚀 使用指南

### DAW 整合測試
```bash
# 1. 啟動開發伺服器
npm run dev

# 2. 打開瀏覽器到 http://localhost:3001
# 3. 打開開發者工具控制台
# 4. 複製 tools/testing/test-daw-integration.js 內容並執行
```

## 📝 添加新工具

當你創建新的開發工具時：

1. 選擇適當的子目錄（或創建新目錄）
2. 添加清晰的註釋和使用說明
3. 更新此 README 文檔
4. 考慮添加到 package.json 的 scripts 中

## 🔧 建議的工具分類

- `testing/` - 測試腳本和工具
- `build/` - 建置相關腳本
- `dev/` - 開發輔助工具
- `deployment/` - 部署腳本
- `utilities/` - 通用實用程式 