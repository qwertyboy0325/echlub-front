# 狀態管理系統

## 概述

本系統採用分層的狀態管理架構，結合事件驅動和響應式編程模式，實現了高效、可靠的狀態管理機制。

## 核心概念

### 1. 狀態類型

#### 應用狀態（Application State）
```typescript
interface AppState {
    project: ProjectState;
    tracks: TrackState[];
    clips: ClipState[];
    ui: UIState;
    audio: AudioState;
}

interface ProjectState {
    id: string;
    name: string;
    bpm: number;
    timeSignature: TimeSignature;
    createdAt: Date;
    updatedAt: Date;
}

interface TrackState {
    id: string;
    name: string;
    volume: number;
    pan: number;
    isMuted: boolean;
    isSoloed: boolean;
    effects: EffectState[];
}

interface ClipState {
    id: string;
    trackId: string;
    audioUrl: string;
    startTime: number;
    duration: number;
    offset: number;
}

interface UIState {
    selectedTrackId: string | null;
    selectedClipId: string | null;
    timelinePosition: number;
    zoom: number;
    isPlaying: boolean;
    isRecording: boolean;
}

interface AudioState {
    masterVolume: number;
    isAudioContextInitialized: boolean;
    sampleRate: number;
    bufferSize: number;
}
```

#### 持久化狀態（Persistent State）
```typescript
interface PersistentState {
    project: ProjectState;
    tracks: TrackState[];
    clips: ClipState[];
    settings: UserSettings;
}

interface UserSettings {
    theme: 'light' | 'dark';
    shortcuts: Record<string, string>;
    audioSettings: AudioSettings;
}
```

### 2. 狀態管理器

#### StateManager
```typescript
@injectable()
class StateManager {
    private state: AppState;
    private subscribers: Set<StateSubscriber>;

    constructor(
        @inject(TYPES.LocalStorageService) 
        private storage: LocalStorageService,
        @inject(TYPES.EventBus)
        private eventBus: EventBus
    ) {
        this.state = this.getInitialState();
        this.subscribers = new Set();
        this.initializeEventHandlers();
    }

    private initializeEventHandlers(): void {
        this.eventBus.on('track:created', this.handleTrackCreated);
        this.eventBus.on('clip:added', this.handleClipAdded);
        this.eventBus.on('state:changed', this.handleStateChanged);
    }

    public getState<T>(selector: (state: AppState) => T): T {
        return selector(this.state);
    }

    public async updateState(
        updater: (state: AppState) => Partial<AppState>
    ): Promise<void> {
        const updates = updater(this.state);
        this.state = { ...this.state, ...updates };
        await this.notifySubscribers();
        await this.persistState();
    }
}
```

#### StateSubscriber
```typescript
interface StateSubscriber {
    onStateChanged(state: AppState): void;
}

class TrackListComponent implements StateSubscriber {
    onStateChanged(state: AppState): void {
        const tracks = state.tracks;
        // 更新視圖
    }
}
```

### 3. 狀態持久化

#### LocalStorageService
```typescript
@injectable()
class LocalStorageService {
    private readonly PREFIX = 'daw_';

    async saveState(state: PersistentState): Promise<void> {
        try {
            const serialized = JSON.stringify(state);
            localStorage.setItem(
                this.PREFIX + 'state',
                serialized
            );
        } catch (error) {
            console.error('Failed to save state:', error);
            throw new Error('State persistence failed');
        }
    }

    async loadState(): Promise<PersistentState | null> {
        try {
            const serialized = localStorage.getItem(
                this.PREFIX + 'state'
            );
            return serialized ? JSON.parse(serialized) : null;
        } catch (error) {
            console.error('Failed to load state:', error);
            return null;
        }
    }
}
```

## 狀態更新流程

### 1. 同步更新

```typescript
// 在組件中更新狀態
class TrackComponent {
    constructor(
        @inject(TYPES.StateManager)
        private stateManager: StateManager
    ) {}

    async setTrackVolume(trackId: string, volume: number): Promise<void> {
        await this.stateManager.updateState(state => ({
            tracks: state.tracks.map(track =>
                track.id === trackId
                    ? { ...track, volume }
                    : track
            )
        }));
    }
}
```

### 2. 事件驅動更新

```typescript
// 通過事件更新狀態
class AudioEngine {
    constructor(
        @inject(TYPES.EventBus)
        private eventBus: EventBus
    ) {
        this.eventBus.on('track:volume:changed', this.handleVolumeChange);
    }

    private handleVolumeChange = (
        payload: { trackId: string; volume: number }
    ): void => {
        const { trackId, volume } = payload;
        const track = this.tracks.get(trackId);
        if (track) {
            track.setVolume(volume);
        }
    };
}
```

## 性能優化

### 1. 狀態分片

```typescript
// 將狀態分割為更小的部分
interface TrackSlice {
    tracks: TrackState[];
    selectedTrackId: string | null;
}

interface ClipSlice {
    clips: ClipState[];
    selectedClipId: string | null;
}

// 使用選擇器獲取特定狀態片段
const selectTrackSlice = (state: AppState): TrackSlice => ({
    tracks: state.tracks,
    selectedTrackId: state.ui.selectedTrackId
});
```

### 2. 記憶化選擇器

```typescript
// 使用記憶化避免不必要的重新計算
const selectTrackById = memoize(
    (state: AppState, trackId: string): TrackState | undefined =>
        state.tracks.find(track => track.id === trackId)
);

const selectTrackClips = memoize(
    (state: AppState, trackId: string): ClipState[] =>
        state.clips.filter(clip => clip.trackId === trackId)
);
```

### 3. 批量更新

```typescript
// 合併多個更新操作
class BatchUpdateManager {
    private updates: Array<(state: AppState) => Partial<AppState>> = [];
    private isScheduled = false;

    constructor(
        @inject(TYPES.StateManager)
        private stateManager: StateManager
    ) {}

    addUpdate(
        update: (state: AppState) => Partial<AppState>
    ): void {
        this.updates.push(update);
        this.scheduleUpdate();
    }

    private scheduleUpdate(): void {
        if (!this.isScheduled) {
            this.isScheduled = true;
            requestAnimationFrame(this.processUpdates);
        }
    }

    private processUpdates = async (): Promise<void> => {
        const updates = this.updates;
        this.updates = [];
        this.isScheduled = false;

        await this.stateManager.updateState(state => {
            return updates.reduce(
                (acc, update) => ({ ...acc, ...update(state) }),
                {}
            );
        });
    };
}
```

## 狀態監控

### 1. 狀態日誌

```typescript
// 記錄狀態變更
class StateLogger {
    constructor(
        @inject(TYPES.StateManager)
        private stateManager: StateManager
    ) {
        this.stateManager.subscribe(this.logStateChange);
    }

    private logStateChange = (state: AppState): void => {
        console.log('[State Update]', {
            timestamp: new Date(),
            state: this.sanitizeState(state)
        });
    };

    private sanitizeState(state: AppState): any {
        // 移除敏感信息
        return {
            ...state,
            project: {
                ...state.project,
                id: '***'
            }
        };
    }
}
```

### 2. 性能監控

```typescript
// 監控狀態更新性能
class StatePerformanceMonitor {
    private updateTimes: number[] = [];

    constructor(
        @inject(TYPES.StateManager)
        private stateManager: StateManager
    ) {
        this.stateManager.subscribe(this.measureUpdateTime);
    }

    private measureUpdateTime = (): void => {
        const startTime = performance.now();
        
        // 在下一幀測量更新時間
        requestAnimationFrame(() => {
            const duration = performance.now() - startTime;
            this.updateTimes.push(duration);
            
            if (this.updateTimes.length > 100) {
                this.updateTimes.shift();
            }

            const averageTime = this.getAverageUpdateTime();
            if (averageTime > 16) {
                console.warn(
                    'State updates are taking too long:',
                    averageTime.toFixed(2),
                    'ms'
                );
            }
        });
    };

    private getAverageUpdateTime(): number {
        return this.updateTimes.reduce((a, b) => a + b, 0) /
            this.updateTimes.length;
    }
}
```

## 錯誤處理

### 1. 狀態驗證

```typescript
// 驗證狀態更新
class StateValidator {
    validate(state: AppState): void {
        this.validateProject(state.project);
        this.validateTracks(state.tracks);
        this.validateClips(state.clips);
        this.validateAudioState(state.audio);
    }

    private validateProject(project: ProjectState): void {
        if (project.bpm < 20 || project.bpm > 400) {
            throw new StateValidationError(
                'Project BPM out of valid range'
            );
        }
    }

    private validateTracks(tracks: TrackState[]): void {
        const trackIds = new Set<string>();
        for (const track of tracks) {
            if (trackIds.has(track.id)) {
                throw new StateValidationError(
                    'Duplicate track ID detected'
                );
            }
            trackIds.add(track.id);
        }
    }
}
```

### 2. 狀態恢復

```typescript
// 實現狀態回滾機制
class StateRecovery {
    private stateHistory: AppState[] = [];
    private maxHistoryLength = 10;

    constructor(
        @inject(TYPES.StateManager)
        private stateManager: StateManager
    ) {
        this.stateManager.subscribe(this.saveStateToHistory);
    }

    private saveStateToHistory = (state: AppState): void => {
        this.stateHistory.push(JSON.parse(JSON.stringify(state)));
        if (this.stateHistory.length > this.maxHistoryLength) {
            this.stateHistory.shift();
        }
    };

    public async rollbackToLastValidState(): Promise<void> {
        const lastValidState = this.stateHistory.pop();
        if (lastValidState) {
            await this.stateManager.resetState(lastValidState);
        }
    }
}
```

## 最佳實踐

### 1. 狀態設計原則

- 保持狀態扁平化
- 避免冗餘數據
- 使用不可變更新
- 實現數據規範化

### 2. 性能優化建議

- 使用選擇器訪問狀態
- 實現狀態分片
- 批量處理更新
- 避免深層嵌套

### 3. 調試技巧

- 使用狀態快照
- 實現時間旅行調試
- 記錄狀態變更
- 監控更新性能

## 參考資料

- [Redux 文檔](https://redux.js.org/)
- [Immer 文檔](https://immerjs.github.io/immer/)
- [MobX 文檔](https://mobx.js.org/)
- [狀態管理最佳實踐](https://redux.js.org/style-guide/style-guide)
