# 前端 Bounded Contexts 架構

## 1. 核心概念

### 1.1 Context 基礎介面

```typescript
// 基礎 Context 介面
interface IContext<TState, TCommand, TEvent> {
  // 狀態管理
  getState(): TState;
  subscribe(listener: (state: TState) => void): () => void;
  
  // 命令處理
  execute(command: TCommand): Promise<void>;
  
  // 事件處理
  on(event: TEvent, handler: (payload: any) => void): void;
  off(event: TEvent, handler: (payload: any) => void): void;
}

// 命令基礎介面
interface ICommand {
  type: string;
  payload: any;
}

// 事件基礎介面
interface IEvent {
  type: string;
  payload: any;
}
```

### 1.2 狀態管理

```typescript
// 全局狀態介面
interface RootState {
  clips: Record<string, AudioClip | MidiClip>;
  automationCurves: Record<string, AutomationCurve>;
  pluginInstances: Record<string, PluginInstance>;
  tracks: Record<string, BaseTrack | AudioTrack | InstrumentTrack>;
}

// 狀態管理器
class StateManager {
  private state: RootState;
  private listeners: ((state: RootState) => void)[] = [];

  constructor(initialState: RootState) {
    this.state = initialState;
  }

  getState(): RootState {
    return this.state;
  }

  updateState(updater: (state: RootState) => RootState): void {
    this.state = updater(this.state);
    this.notifyListeners();
  }

  subscribe(listener: (state: RootState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }
}
```

## 2. Context 實現

### 2.1 ClipContext

```typescript
// ClipContext 介面
interface IClipContext extends IContext<ClipState, ClipCommand, ClipEvent> {
  // 特定方法
  moveClip(clipId: string, newStartTime: number): Promise<void>;
  splitClip(clipId: string, splitTime: number): Promise<void>;
  mergeClips(clipId1: string, clipId2: string): Promise<void>;
}

// ClipContext 狀態
interface ClipState {
  clips: Record<string, AudioClip | MidiClip>;
  selectedClipId?: string;
}

// ClipContext 命令
type ClipCommand = 
  | { type: "MOVE_CLIP"; payload: { clipId: string; newStartTime: number } }
  | { type: "SPLIT_CLIP"; payload: { clipId: string; splitTime: number } }
  | { type: "MERGE_CLIPS"; payload: { clipId1: string; clipId2: string } };

// ClipContext 事件
type ClipEvent = 
  | { type: "CLIP_MOVED"; payload: { clipId: string; newStartTime: number } }
  | { type: "CLIP_SPLIT"; payload: { clipId: string; newClipId: string } }
  | { type: "CLIPS_MERGED"; payload: { newClipId: string } };
```

### 2.2 AutomationContext

```typescript
// AutomationContext 介面
interface IAutomationContext extends IContext<AutomationState, AutomationCommand, AutomationEvent> {
  // 特定方法
  addKeyframe(curveId: string, time: number, value: number): Promise<void>;
  removeKeyframe(curveId: string, keyframeId: string): Promise<void>;
  updateKeyframe(curveId: string, keyframeId: string, value: number): Promise<void>;
}

// AutomationContext 狀態
interface AutomationState {
  curves: Record<string, AutomationCurve>;
  selectedCurveId?: string;
}

// AutomationContext 命令
type AutomationCommand = 
  | { type: "ADD_KEYFRAME"; payload: { curveId: string; time: number; value: number } }
  | { type: "REMOVE_KEYFRAME"; payload: { curveId: string; keyframeId: string } }
  | { type: "UPDATE_KEYFRAME"; payload: { curveId: string; keyframeId: string; value: number } };

// AutomationContext 事件
type AutomationEvent = 
  | { type: "KEYFRAME_ADDED"; payload: { curveId: string; keyframeId: string } }
  | { type: "KEYFRAME_REMOVED"; payload: { curveId: string; keyframeId: string } }
  | { type: "KEYFRAME_UPDATED"; payload: { curveId: string; keyframeId: string; value: number } };
```

## 3. 整合與使用

### 3.1 Context 註冊

```typescript
// 在 container.ts 中
container.bind<IClipContext>(TYPES.ClipContext)
  .to(ClipContext)
  .inSingletonScope();

container.bind<IAutomationContext>(TYPES.AutomationContext)
  .to(AutomationContext)
  .inSingletonScope();
```

### 3.2 在組件中使用

```typescript
@injectable()
class TimelineComponent {
  constructor(
    @inject(TYPES.ClipContext) private clipContext: IClipContext,
    @inject(TYPES.AutomationContext) private automationContext: IAutomationContext
  ) {}

  async handleClipMove(clipId: string, newStartTime: number) {
    try {
      await this.clipContext.moveClip(clipId, newStartTime);
      // 更新 UI
    } catch (error) {
      // 錯誤處理
    }
  }
}
```

## 4. 最佳實踐

1. **狀態管理**
   - 每個 Context 維護自己的局部狀態
   - 通過事件系統同步狀態變化
   - 使用不可變狀態更新

2. **命令處理**
   - 命令應該包含所有必要信息
   - 命令處理應該是冪等的
   - 命令處理應該返回 Promise

3. **事件處理**
   - 事件應該包含足夠的上下文信息
   - 事件處理應該是冪等的
   - 事件處理應該是非阻塞的

4. **錯誤處理**
   - 每個命令處理都應該有錯誤處理
   - 錯誤應該包含足夠的上下文信息
   - 錯誤應該被適當記錄

5. **測試**
   - 每個 Context 都應該有單元測試
   - 測試應該覆蓋所有命令和事件
   - 測試應該包含錯誤情況 