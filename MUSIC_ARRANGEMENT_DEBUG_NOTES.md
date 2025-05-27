# 🎵 Music Arrangement BC 調試筆記

## 📋 當前問題狀態

### 🚨 主要問題：CLIP_TYPE_MISMATCH 錯誤
```
❌ Error adding MIDI note: CLIP_TYPE_MISMATCH: Expected clip type MIDI, but got unknown
```

**錯誤位置**：`Track.addMidiNoteToClip()` 方法中
**根本原因**：創建的 MIDI clip 沒有被正確添加到 track 的 `_clips` Map 中

## 🔍 問題分析

### 事件溯源流程問題
1. ✅ `track.addClip(midiClip)` - 正確發出 `ClipAddedToTrackEvent`
2. ❌ `applyClipAddedToTrackEvent()` - 只打印日誌，沒有實際添加 clip
3. ✅ `track.addClipToState(midiClip)` - 應該添加 clip 到 `_clips` Map
4. ❌ **結果**：`addMidiNoteToClip()` 中找不到 clip

### 已嘗試的修復
- ✅ 修復 `TrackRepositoryImpl` 使用內存存儲
- ✅ 添加 `Track.addClipToState()` 方法
- ✅ 修改 command handlers 調用 `addClipToState()`
- ✅ 添加調試日誌
- ❌ **仍然失敗**：clip 沒有被找到

## 🎯 下一步修復計劃

### 1. 調試 `addClipToState()` 方法
**檢查點**：
- [ ] 確認 `addClipToState()` 被正確調用
- [ ] 確認 `clipId` 正確生成和傳遞
- [ ] 確認 `_clips.set()` 實際執行
- [ ] 檢查 `addMidiNoteToClip()` 中的 `clipId` 是否匹配

**調試代碼**：
```typescript
// 在 addMidiNoteToClip 中添加
console.log('Looking for clipId:', clipId.toString());
console.log('Available clips:', Array.from(this._clips.keys()).map(k => k.toString()));
console.log('Clips count:', this._clips.size);
```

### 2. 檢查 ClipId 比較邏輯
**可能問題**：
- ClipId 對象比較問題
- Map key 比較邏輯錯誤
- ClipId.toString() vs ClipId 對象作為 key

**修復方向**：
```typescript
// 可能需要修改 Map 的 key 類型
private _clips: Map<string, Clip>; // 使用 string 而不是 ClipId
```

### 3. 完整的事件溯源修復
**正確的實現**：
```typescript
private applyClipAddedToTrackEvent(event: ClipAddedToTrackEvent): void {
  // 從 repository 重建 clip 或從事件中獲取 clip 數據
  // 這需要修改事件結構，包含完整的 clip 數據
}
```

## 📁 相關文件

### 核心文件
- `src/modules/music-arrangement/domain/aggregates/Track.ts` - 主要問題所在
- `src/modules/music-arrangement/application/handlers/CreateMidiClipCommandHandler.ts`
- `src/modules/music-arrangement/infrastructure/repositories/TrackRepositoryImpl.ts`

### 測試文件
- `test-real-music-arrangement-vite.html` - 主要測試界面

## 🧪 測試步驟

1. 啟動開發服務器：`npm run dev`
2. 訪問：`http://localhost:3001/test-real-music-arrangement-vite.html`
3. 創建軌道（instrument 類型）
4. 嘗試添加 MIDI 音符
5. 觀察控制台日誌和錯誤信息

## 💡 可能的解決方案

### 方案 A：修復 Map key 比較
```typescript
// 使用 string 作為 Map key
private _clips: Map<string, Clip> = new Map();

public addClipToState(clip: Clip): void {
  this._clips.set(clip.clipId.toString(), clip);
}

public addMidiNoteToClip(clipId: ClipId, note: MidiNote): void {
  const clip = this._clips.get(clipId.toString()); // 使用 toString()
  // ...
}
```

### 方案 B：修改事件結構
```typescript
// 在事件中包含完整的 clip 數據
export class ClipAddedToTrackEvent extends DomainEvent {
  constructor(
    public readonly trackId: TrackId,
    public readonly clip: Clip // 包含完整 clip 對象
  ) {
    super('ClipAddedToTrack', trackId);
  }
}
```

### 方案 C：簡化事件溯源
```typescript
// 暫時跳過事件溯源，直接在 addClip 中添加到狀態
public addClip(clip: Clip): void {
  this.validateClipType(clip);
  this.validateNoOverlap(clip.range);
  
  // 直接添加到狀態
  this._clips.set(clip.clipId.toString(), clip);
  
  // 然後發出事件
  this.raiseEvent(new ClipAddedToTrackEvent(this._trackId, clip.clipId, clip.getType()));
}
```

## 🔧 調試工具

### 添加詳細日誌
```typescript
// 在 Track 類中添加
public debugClipState(): void {
  console.log('=== Track Clip Debug ===');
  console.log('Track ID:', this._trackId.toString());
  console.log('Clips count:', this._clips.size);
  console.log('Clip IDs:', Array.from(this._clips.keys()).map(k => k.toString()));
  console.log('Clip types:', Array.from(this._clips.values()).map(c => c.getType()));
  console.log('========================');
}
```

## 📝 提醒事項

1. **重點檢查**：ClipId 的比較邏輯和 Map key 類型
2. **調試優先級**：先確認 clip 是否被正確添加到 Map
3. **備用方案**：如果事件溯源太複雜，可以暫時簡化實現
4. **測試環境**：確保在 Vite 開發服務器中測試

## 🎯 成功標準

- ✅ 創建 MIDI clip 成功
- ✅ 添加 MIDI 音符成功
- ✅ 獲取軌道片段顯示創建的 clips
- ✅ 量化和移調功能正常工作

---
**最後更新**：2024-12-XX
**狀態**：🔧 進行中 - 需要調試 ClipId 比較邏輯 