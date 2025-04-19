# 音軌模組 (Track Module)

## 概述

音軌模組是一個完整的領域驅動設計(DDD)實現，用於管理數位音頻工作站(DAW)中的音軌。該模組支持音頻音軌、樂器音軌和總線音軌，並提供完整的音軌生命週期管理。

## 架構

模組採用分層架構：

### 領域層 (Domain)

- **實體 (Entities)**
  - `BaseTrack`: 音軌基礎類，定義共同行為
  - `AudioTrack`: 音頻音軌，用於音頻片段處理
  - `InstrumentTrack`: 樂器音軌，用於MIDI片段處理
  - `BusTrack`: 總線音軌，用於音軌路由和混音

- **值對象 (Value Objects)**
  - `TrackId`: 音軌唯一標識符
  - `TrackType`: 音軌類型枚舉
  - `TrackRouting`: 音軌路由配置
  - `ClipId`: 片段ID基類
  - `AudioClipId`: 音頻片段ID
  - `MidiClipId`: MIDI片段ID
  - `PluginReference`: 插件引用

### 應用層 (Application)

- **服務 (Services)**
  - `TrackService`: 提供高層業務邏輯
  - `TrackDomainService`: 處理跨實體的領域邏輯

- **命令處理器 (Command Handlers)**
  - 創建音軌
  - 重命名音軌
  - 添加/移除片段
  - 更改路由設置
  - 管理插件
  - 管理總線輸入

- **驗證器 (Validators)**
  - `TrackValidator`: 驗證所有音軌相關操作

### 基礎設施層 (Infrastructure)

- **持久化 (Persistence)**
  - `LocalTrackRepository`: 本地音軌存儲
  - `TrackRepositoryCoordinator`: 存儲協調器

- **適配器 (Adapters)**
  - `TrackEventBusAdapter`: 事件總線適配器
  - `PluginReferenceAdapter`: 插件引用適配器

## 主要功能

### 音軌管理

```typescript
// 創建音軌
const trackId = await trackService.createTrack("主音軌", "audio");

// 重命名音軌
await trackService.renameTrack(trackId, "新名稱");

// 設置音軌路由
await trackService.setTrackRouting(trackId, new TrackRouting("input-1", "output-1"));
```

### 片段管理

```typescript
// 添加片段到音軌
await trackService.addClipToTrack(trackId, clipId);

// 從音軌移除片段
await trackService.removeClipFromTrack(trackId, clipId);
```

### 插件管理

```typescript
// 添加插件
await trackService.addPluginToTrack(trackId, pluginRef);

// 移除插件
await trackService.removePluginFromTrack(trackId, pluginRef);
```

### 總線音軌特性

```typescript
// 添加輸入音軌到總線
await trackService.addInputTrackToBus(busTrackId, inputTrackId);

// 設置發送
busTrack.addSendSetting({
  id: "send-1",
  targetTrackId: "target-1",
  level: 0.8,
  pan: 0.0
});
```

## 事件系統

模組實現了完整的事件系統，支持以下事件：

- TrackCreatedEvent
- TrackUpdatedEvent
- TrackDeletedEvent
- TrackRenamedEvent
- PluginAddedToTrackEvent
- PluginRemovedFromTrackEvent

## 依賴注入

使用 InversifyJS 進行依賴注入，配置位於 `TrackModule.ts`：

```typescript
export class TrackModule {
  static configure(container: Container): void {
    // 注冊所有服務和處理器
    container.bind(TrackTypes.TrackService).to(TrackService);
    container.bind(TrackTypes.TrackRepository).to(TrackRepositoryCoordinator);
    // ... 其他綁定
  }
}
```

## 使用示例

```typescript
// 初始化
const container = new Container();
TrackModule.configure(container);
const trackService = container.get<TrackService>(TrackTypes.TrackService);

// 創建並配置音軌
const trackId = await trackService.createTrack("主音軌", "audio");
await trackService.addPluginToTrack(trackId, compressorPlugin);
await trackService.setTrackRouting(trackId, new TrackRouting("input-1", "main-out"));

// 音量和靜音控制
await trackService.updateTrackVolume(trackId, 0.8);
await trackService.toggleMute(trackId);
```

## 測試

模組包含完整的單元測試和集成測試：

- 實體測試
- 命令處理器測試
- 服務層測試
- 存儲層測試

運行測試：

```bash
npm test src/modules/track
```
