# 狀態管理系統

## 概述

本系統採用集中式狀態管理，作為表現層和領域層之間的橋樑，負責管理應用狀態、處理狀態更新、發送領域事件，並確保狀態的一致性。

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
        @inject(TYPES.StorageService) 
        private storage: StorageService,
        @inject(TYPES.DomainEventBus)
        private domainEventBus: EventBus
    ) {
        this.state = this.getInitialState();
        this.subscribers = new Set();
        this.initializeEventHandlers();
    }

    private initializeEventHandlers(): void {
        // 監聽領域事件
        this.domainEventBus.on('domain:track:created', this.handleTrackCreated);
        this.domainEventBus.on('domain:track:updated', this.handleTrackUpdated);
        this.domainEventBus.on('domain:track:deleted', this.handleTrackDeleted);
    }

    public getState<T>(selector: (state: AppState) => T): T {
        return selector(this.state);
    }

    public async updateState(
        updater: (state: AppState) => Partial<AppState>
    ): Promise<void> {
        const updates = updater(this.state);
        this.state = { ...this.state, ...updates };
        
        // 發送領域事件
        if (updates.tracks) {
            this.domainEventBus.emit('domain:track:updated', {
                track: updates.tracks[updates.tracks.length - 1]
            });
        }
        
        await this.notifySubscribers();
        await this.persistState();
    }

    private async persistState(): Promise<void> {
        await this.storage.saveState({
            project: this.state.project,
            tracks: this.state.tracks,
            clips: this.state.clips
        });
    }

    private async notifySubscribers(): Promise<void> {
        for (const subscriber of this.subscribers) {
            await subscriber.onStateChanged(this.state);
        }
    }
}
```

#### StateSubscriber
```typescript
interface StateSubscriber {
    onStateChanged(state: AppState): void;
}

class TrackListComponent implements StateSubscriber {
    constructor(private stateManager: StateManager) {
        this.stateManager.subscribe(this);
    }

    onStateChanged(state: AppState): void {
        const tracks = state.tracks;
        this.renderTracks(tracks);
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

### 1. UI 觸發更新

```typescript
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

### 2. 領域事件處理

```typescript
class StateManager {
    private handleTrackCreated = (payload: DomainEventPayload['domain:track:created']): void => {
        this.updateState(state => ({
            tracks: [...state.tracks, payload.track]
        }));
    };

    private handleTrackUpdated = (payload: DomainEventPayload['domain:track:updated']): void => {
        this.updateState(state => ({
            tracks: state.tracks.map(track =>
                track.id === payload.track.id
                    ? payload.track
                    : track
            )
        }));
    };
}
```

## 性能優化

### 1. 狀態選擇器

```typescript
// 使用選擇器優化性能
const selectTrackById = (state: AppState, trackId: string): TrackState | undefined =>
    state.tracks.find(track => track.id === trackId);

const selectActiveClips = (state: AppState): ClipState[] =>
    state.clips.filter(clip => !clip.isDeleted);
```

### 2. 記憶化

```typescript
// 使用記憶化避免不必要的重新計算
const selectTrackById = memoize(
    (state: AppState, trackId: string): TrackState | undefined =>
        state.tracks.find(track => track.id === trackId)
);
```

### 3. 批量更新

```typescript
class StateManager {
    private updateQueue: Partial<AppState>[] = [];
    private isUpdating: boolean = false;

    async batchUpdate(updates: Partial<AppState>[]): Promise<void> {
        this.updateQueue.push(...updates);
        if (!this.isUpdating) {
            await this.processUpdateQueue();
        }
    }

    private async processUpdateQueue(): Promise<void> {
        this.isUpdating = true;
        while (this.updateQueue.length > 0) {
            const updates = this.updateQueue.splice(0, 10);
            const mergedUpdate = this.mergeUpdates(updates);
            await this.updateState(() => mergedUpdate);
        }
        this.isUpdating = false;
    }
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

### 1. 狀態錯誤

```typescript
class StateError extends Error {
    constructor(
        message: string,
        public code: string,
        public state: Partial<AppState>
    ) {
        super(message);
        this.name = 'StateError';
    }
}

class StateManager {
    private validateState(state: AppState): void {
        if (!state.project) {
            throw new StateError(
                'Project state is required',
                'INVALID_STATE',
                state
            );
        }
    }
}
```

### 2. 錯誤恢復

```typescript
class StateManager {
    private stateHistory: AppState[] = [];

    async updateState(updater: (state: AppState) => Partial<AppState>): Promise<void> {
        try {
            this.stateHistory.push({ ...this.state });
            const updates = updater(this.state);
            this.state = { ...this.state, ...updates };
            await this.notifySubscribers();
        } catch (error) {
            if (this.stateHistory.length > 0) {
                this.state = this.stateHistory.pop()!;
            }
            throw error;
        }
    }
}
```

## 測試策略

### 1. 單元測試

```typescript
describe('StateManager', () => {
    let stateManager: StateManager;
    let storage: StorageService;
    let eventBus: EventBus;

    beforeEach(() => {
        storage = mock<StorageService>();
        eventBus = mock<EventBus>();
        stateManager = new StateManager(storage, eventBus);
    });

    it('should update state and notify subscribers', async () => {
        const subscriber = mock<StateSubscriber>();
        stateManager.subscribe(subscriber);

        await stateManager.updateState(state => ({
            tracks: [...state.tracks, newTrack]
        }));

        expect(subscriber.onStateChanged).toHaveBeenCalled();
    });
});
```

### 2. 集成測試

```typescript
describe('State Management Integration', () => {
    it('should handle track creation flow', async () => {
        const stateManager = container.get<StateManager>(TYPES.StateManager);
        const eventBus = container.get<EventBus>(TYPES.EventBus);

        // 觸發 UI 事件
        eventBus.emit('ui:track:create');

        // 驗證狀態更新
        const state = stateManager.getState(state => state.tracks);
        expect(state).toHaveLength(1);
    });
});
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
