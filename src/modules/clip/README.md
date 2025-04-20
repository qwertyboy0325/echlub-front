# Clip Module

## 架構概述

Clip Module 是一個基於領域驅動設計(DDD)的音頻/MIDI片段管理模組，採用CQRS模式實現。

### 核心概念

- **Clip**: 代表一個音頻或MIDI片段
  - `AudioClip`: 音頻片段，包含波形數據和淡入淡出設置
  - `MidiClip`: MIDI片段，包含音符、事件和拍號信息

### 目錄結構

```
clip/
├── application/          # 應用層
│   ├── commands/        # 命令定義
│   ├── handlers/        # 命令處理器
│   ├── mediators/       # 中介者
│   ├── services/        # 應用服務
│   └── validators/      # 驗證器
├── domain/              # 領域層
│   ├── entities/        # 實體
│   ├── events/          # 領域事件
│   ├── errors/          # 錯誤定義
│   ├── interfaces/      # 接口定義
│   ├── repositories/    # 倉儲接口
│   └── value-objects/   # 值對象
└── infrastructure/      # 基礎設施層
    ├── api/            # API客戶端
    ├── p2p/            # P2P同步
    └── stores/         # 狀態管理

## 主要組件

### 實體 (Entities)

#### BaseClip
- 所有片段的基礎類
- 管理通用屬性：ID、開始時間、持續時間、增益
- 版本控制支持

#### AudioClip
- 繼承自 BaseClip
- 管理音頻特有屬性：採樣ID、偏移量、波形數據
- 支持淡入淡出效果

#### MidiClip
- 繼承自 BaseClip
- 管理MIDI音符和事件
- 支持拍號設置

### 服務 (Services)

#### ClipService
- 提供片段操作的高層接口
- 處理驗證和錯誤管理
- 支持的操作：
  - createAudioClip
  - createMidiClip
  - updateClip
  - deleteClip
  - updateClipGain

### 命令處理 (Commands)

支持的命令：
- CreateAudioClipCommand
- CreateMidiClipCommand
- EditAudioClipCommand
- EditMidiClipCommand
- UpdateClipCommand
- DeleteClipCommand

### 事件系統 (Events)

支持的事件：
- ClipCreatedEvent
- ClipUpdatedEvent
- ClipDeletedEvent
- AudioClipCreatedEvent
- MidiClipCreatedEvent

## 使用示例

### 創建音頻片段

```typescript
const clipService = container.get<ClipService>(ClipTypes.ClipService);

const clipId = await clipService.createAudioClip(
  "sample123",    // 採樣ID
  0,              // 開始時間
  120,            // 持續時間
  0               // 偏移量
);
```

### 創建MIDI片段

```typescript
const clipId = await clipService.createMidiClip(
  0,              // 開始時間
  240,            // 持續時間
  {               // 拍號（可選）
    numerator: 4,
    denominator: 4
  }
);
```

### 更新片段

```typescript
await clipService.updateClip(clipId, {
  gain: 0.8,
  startTime: 10,
  duration: 100
});
```

## 錯誤處理

模組定義了兩種主要錯誤類型：
- `ClipValidationError`: 驗證錯誤
- `ClipOperationError`: 操作錯誤

所有操作都包含適當的錯誤處理和驗證。

## P2P同步

ClipStore 提供了 P2P 同步功能：
- 自動同步片段參數更新
- 處理來自其他節點的更新
- 維護本地和遠程狀態一致性

## 最佳實踐

1. 始終使用 ClipService 進行操作，避免直接操作實體
2. 使用命令模式進行狀態修改
3. 訂閱相關事件以響應狀態變化
4. 確保正確處理錯誤和驗證
5. 在修改片段前檢查版本號避免衝突
