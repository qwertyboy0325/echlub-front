# ECHLUB DAW

ECHLUB DAW 是一個基於 Web 技術的數位音頻工作站（Digital Audio Workstation），提供專業級的音頻編輯、混音和製作功能。

## 功能特點

### 核心功能
- 🎵 多軌音頻編輯
- 🎚️ 專業混音工具
- 🎼 MIDI 支持
- 🎹 虛擬樂器
- 🎛️ 音頻效果器
- 🎨 波形可視化
- 🎯 精確的時間軸控制
- 🔄 實時音頻處理

### 技術特點
- 🌐 基於 Web 技術，無需安裝
- ⚡ 高性能音頻引擎
- 🎨 流暢的用戶界面
- 🔄 實時協作支持
- 💾 自動保存和版本控制
- 📱 響應式設計

## 技術棧

- **前端框架**：TypeScript + React
- **音頻處理**：Web Audio API
- **圖形渲染**：PixiJS
- **狀態管理**：自定義狀態管理系統
- **構建工具**：Webpack + Babel
- **測試框架**：Jest

## 快速開始

### 環境要求
- Node.js >= 18
- npm >= 9

### 安裝
```bash
# 克隆專案
git clone https://github.com/yourusername/echlub_front.git

# 進入專案目錄
cd echlub_front

# 安裝依賴
npm install
```

### 開發
```bash
# 啟動開發服務器
npm run dev

# 運行測試
npm test

# 構建專案
npm run build
```

## 專案結構

```
echlub_front/
├── src/                    # 源代碼
│   ├── data/              # 數據層
│   ├── services/          # 服務層
│   ├── utils/             # 工具類
│   └── __tests__/         # 測試文件
├── docs/                   # 文檔
│   └── architecture/      # 架構文檔
├── public/                # 靜態資源
└── package.json          # 項目配置
```

## 文檔

詳細文檔請參考 [架構文檔](docs/architecture/README.md)

## 貢獻指南

1. Fork 本專案
2. 創建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 版本歷史

- 0.1.0
  - 初始版本
  - 基本音頻編輯功能
  - 多軌支持
  - 波形顯示

## 授權

本專案採用 MIT 授權 - 詳見 [LICENSE](LICENSE) 文件

## 聯繫方式

- 專案維護者：[Your Name]
- 電子郵件：[your.email@example.com]
- 專案鏈接：[https://github.com/yourusername/echlub_front](https://github.com/yourusername/echlub_front)

## 致謝

- Web Audio API
- PixiJS
- React
- TypeScript 