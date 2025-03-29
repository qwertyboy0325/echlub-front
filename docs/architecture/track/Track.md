# Track 組件設計文檔

## 1. 概述

`Track` 組件是 DAW 應用中的核心 UI 組件之一，負責管理和展示單個音軌的視覺元素和交互功能。

## 2. 組件結構

### 2.1 核心組件

```typescript
// presentation/components/daw/track/Track.ts
export class Track extends BaseComponent {
    private controls: TrackControls;
    private content: TrackContent;
    private readonly id: string;
}
```

### 2.2 子組件

1. **TrackControls**: 軌道控制區域
2. **TrackContent**: 軌道內容區域
3. **Clip**: 音頻片段組件

## 3. 目錄結構

```
src/
└── presentation/
    └── components/
        └── daw/
            └── track/
                ├── Track.ts              # 軌道主組件
                ├── TrackControls.ts      # 控制區組件
                ├── TrackContent.ts       # 內容區組件
                └── TrackList.ts          # 軌道列表組件
```

## 4. 事件系統

### 4.1 UI 事件

```typescript
interface TrackUIEvents {
    'ui:track:dragstart': { trackId: string; y: number };
    'ui:track:drag': { trackId: string; y: number };
    'ui:track:dragend': { trackId: string; y: number };
    'ui:track:rename': { trackId: string; name: string };
}
```

### 4.2 Domain 事件

```typescript
interface TrackDomainEvents {
    'domain:track:reorder': { trackId: string; newIndex: number };
    'domain:track:rename': { trackId: string; name: string };
}
```

## 5. 組件職責

### 5.1 Track 組件

- 管理軌道的整體佈局
- 協調 Controls 和 Content 子組件
- 處理軌道級別的事件

### 5.2 TrackControls 組件

- 顯示軌道控制元素（名稱、按鈕等）
- 處理軌道拖拽功能
- 管理軌道重命名

### 5.3 TrackContent 組件

- 顯示軌道內容區域
- 管理音頻片段的展示
- 處理片段的拖放和調整

### 5.4 TrackList 組件

- 管理多個軌道的排序
- 處理軌道之間的交互
- 維護軌道的垂直佈局

## 6. 實現示例

### 6.1 Track 組件

```typescript
export class Track extends BaseComponent {
    constructor(id: string, private track: ITrack) {
        super(id);
    }

    protected setupComponent(): void {
        this.controls = new TrackControls(`${this.id}-controls`, this.track);
        this.content = new TrackContent(`${this.id}-content`);
        
        this.container.addChild(this.controls.getContainer());
        this.container.addChild(this.content.getContainer());
    }

    protected setupEventHandlers(): void {
        this.onUIEvent('ui:track:dragstart', this.handleDragStart);
        this.onUIEvent('ui:track:drag', this.handleDrag);
        this.onUIEvent('ui:track:dragend', this.handleDragEnd);
    }
}
```

## 7. 最佳實踐

### 7.1 狀態管理

- 使用 Domain 事件進行狀態更新
- 保持 UI 組件的無狀態性
- 通過事件系統同步狀態變化

### 7.2 性能優化

- 使用事件節流控制拖拽更新頻率
- 實現虛擬滾動優化大量軌道
- 優化重繪和更新邏輯

### 7.3 錯誤處理

- 優雅處理資源加載失敗
- 提供用戶友好的錯誤提示
- 實現錯誤恢復機制

## 8. 注意事項

1. **事件處理**
   - 正確清理事件監聽器
   - 避免事件監聽器洩漏
   - 使用事件委託優化性能

2. **資源管理**
   - 及時釋放不需要的資源
   - 正確處理組件銷毀
   - 避免內存洩漏

3. **可訪問性**
   - 支持鍵盤操作
   - 提供適當的 ARIA 標籤
   - 確保顏色對比度 