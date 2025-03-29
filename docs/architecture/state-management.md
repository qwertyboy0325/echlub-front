# DAW 狀態管理系統設計文檔

## 1. 系統概述

DAW 的狀態管理系統主要負責：

1. 應用程序狀態管理
2. 音頻狀態管理
3. UI 狀態管理
4. 狀態持久化

系統通過依賴注入（DI）進行整合，確保狀態管理的靈活性和可測試性。

### 1.1 DI 整合

狀態管理系統的核心組件通過 DI 容器進行管理：

```typescript
// types.ts
export const TYPES = {
    StateManager: Symbol.for('StateManager'),
    StateStore: Symbol.for('StateStore'),
    StateSlice: Symbol.for('StateSlice')
};

export interface IStateManager {
    getStore<T>(name: string): StateStore<T>;
    registerSlice<T>(slice: StateSlice<T>): void;
    dispatch(action: any): void;
}

export interface IStateStore<T> {
    getState(): T;
    setState(state: T): void;
    subscribe(listener: (state: T) => void): () => void;
}
```

### 1.2 服務註冊

狀態管理系統的服務在 DI 容器中註冊：

```typescript
// container.ts
container.bind<IStateManager>(TYPES.StateManager).to(StateManager).inSingletonScope();
container.bind<IStateStore<any>>(TYPES.StateStore).to(StateStoreImpl).inTransientScope();
container.bind<IStateSlice<any>>(TYPES.StateSlice).to(StateSliceImpl).inTransientScope();
```

## 2. 核心組件

### 2.1 狀態存儲

```typescript
@injectable()
export class StateStoreImpl<T> implements IStateStore<T> {
    constructor(
        @inject(TYPES.EventBus) private eventBus: IEventBus<StateEvents>
    ) {
        this.state = initialState;
        this.listeners = new Set();
    }
    
    getState(): T {
        return this.state;
    }
    
    setState(state: T): void {
        this.state = state;
        this.notifyListeners();
    }
    
    subscribe(listener: (state: T) => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    
    private notifyListeners(): void {
        this.listeners.forEach(listener => listener(this.state));
    }
}
```

### 2.2 狀態切片

```typescript
@injectable()
export class StateSliceImpl<T> implements IStateSlice<T> {
    constructor(
        @inject(TYPES.EventBus) private eventBus: IEventBus<StateEvents>,
        public name: string,
        public initialState: T,
        public reducers: Record<string, (state: T, action: any) => T>
    ) {}
    
    // 創建 reducer
    createReducer(): (state: T | undefined, action: any) => T {
        return (state = this.initialState, action: any): T => {
            const reducer = this.reducers[action.type];
            if (reducer) {
                return reducer(state, action);
            }
            return state;
        };
    }
    
    // 創建 action creators
    createActions(): Record<string, (...args: any[]) => any> {
        const actions: Record<string, (...args: any[]) => any> = {};
        
        Object.keys(this.reducers).forEach(type => {
            actions[type] = (...args: any[]) => ({
                type,
                payload: args[0]
            });
        });
        
        return actions;
    }
}
```

### 2.3 狀態管理器

```typescript
@injectable()
export class StateManager implements IStateManager {
    constructor(
        @inject(TYPES.EventBus) private eventBus: IEventBus<StateEvents>,
        @inject(TYPES.StateStore) private storeFactory: Factory<IStateStore<any>>
    ) {
        this.stores = new Map();
        this.slices = new Map();
    }
    
    // 註冊狀態切片
    registerSlice<T>(slice: StateSlice<T>): void {
        this.slices.set(slice.name, slice);
        this.stores.set(slice.name, this.storeFactory.createNew());
    }
    
    // 獲取狀態存儲
    getStore<T>(name: string): StateStore<T> | undefined {
        return this.stores.get(name);
    }
    
    // 獲取狀態切片
    getSlice<T>(name: string): StateSlice<T> | undefined {
        return this.slices.get(name);
    }
    
    // 分發 action
    dispatch(action: any): void {
        this.slices.forEach((slice, name) => {
            const store = this.stores.get(name);
            if (store && slice.reducers[action.type]) {
                const currentState = store.getState();
                const newState = slice.reducers[action.type](currentState, action);
                store.setState(newState);
            }
        });
    }
}
```

## 3. 狀態切片定義

### 3.1 播放狀態切片

```typescript
interface PlaybackState {
    isPlaying: boolean;
    currentTime: number;
    bpm: number;
    loopStart: number;
    loopEnd: number;
    isLooping: boolean;
}

const playbackSlice = new StateSliceImpl<PlaybackState>(
    'playback',
    {
        isPlaying: false,
        currentTime: 0,
        bpm: 120,
        loopStart: 0,
        loopEnd: 0,
        isLooping: false
    },
    {
        'playback/start': (state) => ({
            ...state,
            isPlaying: true
        }),
        'playback/stop': (state) => ({
            ...state,
            isPlaying: false
        }),
        'playback/pause': (state) => ({
            ...state,
            isPlaying: false
        }),
        'playback/setTime': (state, action) => ({
            ...state,
            currentTime: action.payload
        }),
        'playback/setBPM': (state, action) => ({
            ...state,
            bpm: action.payload
        }),
        'playback/setLoop': (state, action) => ({
            ...state,
            loopStart: action.payload.start,
            loopEnd: action.payload.end,
            isLooping: true
        }),
        'playback/clearLoop': (state) => ({
            ...state,
            isLooping: false
        })
    }
);
```

### 3.2 軌道狀態切片

```typescript
interface TrackState {
    tracks: Record<string, Track>;
    selectedTrackId: string | null;
    trackOrder: string[];
}

const trackSlice = new StateSliceImpl<TrackState>(
    'tracks',
    {
        tracks: {},
        selectedTrackId: null,
        trackOrder: []
    },
    {
        'tracks/add': (state, action) => ({
            ...state,
            tracks: {
                ...state.tracks,
                [action.payload.id]: action.payload
            },
            trackOrder: [...state.trackOrder, action.payload.id]
        }),
        'tracks/remove': (state, action) => {
            const { [action.payload]: removed, ...remaining } = state.tracks;
            return {
                ...state,
                tracks: remaining,
                trackOrder: state.trackOrder.filter(id => id !== action.payload),
                selectedTrackId: state.selectedTrackId === action.payload ? null : state.selectedTrackId
            };
        },
        'tracks/select': (state, action) => ({
            ...state,
            selectedTrackId: action.payload
        }),
        'tracks/reorder': (state, action) => ({
            ...state,
            trackOrder: action.payload
        })
    }
);
```

### 3.3 片段狀態切片

```typescript
interface ClipState {
    clips: Record<string, Clip>;
    selectedClipId: string | null;
}

const clipSlice = new StateSliceImpl<ClipState>(
    'clips',
    {
        clips: {},
        selectedClipId: null
    },
    {
        'clips/add': (state, action) => ({
            ...state,
            clips: {
                ...state.clips,
                [action.payload.id]: action.payload
            }
        }),
        'clips/remove': (state, action) => {
            const { [action.payload]: removed, ...remaining } = state.clips;
            return {
                ...state,
                clips: remaining,
                selectedClipId: state.selectedClipId === action.payload ? null : state.selectedClipId
            };
        },
        'clips/select': (state, action) => ({
            ...state,
            selectedClipId: action.payload
        }),
        'clips/move': (state, action) => ({
            ...state,
            clips: {
                ...state.clips,
                [action.payload.id]: {
                    ...state.clips[action.payload.id],
                    startTime: action.payload.startTime
                }
            }
        })
    }
);
```

## 4. 狀態持久化

### 4.1 持久化服務

```typescript
export interface PersistenceService {
    save(key: string, data: any): Promise<void>;
    load(key: string): Promise<any>;
    remove(key: string): Promise<void>;
}

export class LocalStoragePersistenceService implements PersistenceService {
    async save(key: string, data: any): Promise<void> {
        localStorage.setItem(key, JSON.stringify(data));
    }
    
    async load(key: string): Promise<any> {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }
    
    async remove(key: string): Promise<void> {
        localStorage.removeItem(key);
    }
}
```

### 4.2 狀態持久化管理器

```typescript
export class StatePersistenceManager {
    private static instance: StatePersistenceManager;
    private persistenceService: PersistenceService;
    private stateManager: StateManager;
    
    private constructor() {
        this.persistenceService = new LocalStoragePersistenceService();
        this.stateManager = StateManager.getInstance();
    }
    
    static getInstance(): StatePersistenceManager {
        if (!StatePersistenceManager.instance) {
            StatePersistenceManager.instance = new StatePersistenceManager();
        }
        return StatePersistenceManager.instance;
    }
    
    // 保存狀態
    async saveState(): Promise<void> {
        const state: Record<string, any> = {};
        
        this.stateManager.slices.forEach((slice, name) => {
            const store = this.stateManager.getStore(name);
            if (store) {
                state[name] = store.getState();
            }
        });
        
        await this.persistenceService.save('daw-state', state);
    }
    
    // 加載狀態
    async loadState(): Promise<void> {
        const state = await this.persistenceService.load('daw-state');
        if (state) {
            Object.entries(state).forEach(([name, sliceState]) => {
                const store = this.stateManager.getStore(name);
                if (store) {
                    store.setState(sliceState);
                }
            });
        }
    }
    
    // 清除狀態
    async clearState(): Promise<void> {
        await this.persistenceService.remove('daw-state');
    }
}
```

## 5. 狀態同步

### 5.1 狀態同步服務

```typescript
export class StateSyncService {
    private static instance: StateSyncService;
    private syncInterval: number;
    private syncTimer: NodeJS.Timeout | null;
    
    private constructor() {
        this.syncInterval = 1000; // 1秒
        this.syncTimer = null;
    }
    
    static getInstance(): StateSyncService {
        if (!StateSyncService.instance) {
            StateSyncService.instance = new StateSyncService();
        }
        return StateSyncService.instance;
    }
    
    // 開始同步
    startSync(): void {
        if (!this.syncTimer) {
            this.syncTimer = setInterval(() => {
                this.syncState();
            }, this.syncInterval);
        }
    }
    
    // 停止同步
    stopSync(): void {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
            this.syncTimer = null;
        }
    }
    
    // 同步狀態
    private async syncState(): Promise<void> {
        const stateManager = StateManager.getInstance();
        const persistenceManager = StatePersistenceManager.getInstance();
        
        // 保存當前狀態
        await persistenceManager.saveState();
        
        // 觸發同步事件
        stateManager.dispatch({
            type: 'state/synced',
            payload: Date.now()
        });
    }
}
```

## 6. 最佳實踐

1. **狀態管理原則**
   - 使用不可變狀態更新
   - 集中管理狀態
   - 避免狀態重複
   - 保持狀態簡單

2. **性能優化**
   - 使用選擇器優化渲染
   - 實現狀態分片
   - 避免不必要的更新
   - 使用狀態緩存

3. **錯誤處理**
   - 處理狀態加載錯誤
   - 處理狀態保存錯誤
   - 提供錯誤恢復機制
   - 記錄錯誤日誌

4. **調試支持**
   - 提供狀態快照
   - 支持狀態回放
   - 提供狀態檢查工具
   - 支持狀態導出/導入

5. **測試策略**
   - 測試狀態更新
   - 測試狀態持久化
   - 測試狀態同步
   - 測試錯誤處理
