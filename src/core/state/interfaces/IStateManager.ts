import { IService } from '../../di/interfaces/IService';

/**
 * 時間標記類型
 * Time signature type
 */
export interface TimeSignature {
    numerator: number;    // 分子
    denominator: number;  // 分母
}

/**
 * 效果器狀態
 * Effect state
 */
export interface EffectState {
    id: string;
    type: string;
    parameters: Record<string, number>;
    isEnabled: boolean;
}

/**
 * 專案狀態
 * Project state
 */
export interface ProjectState {
    id: string;
    name: string;
    bpm: number;
    timeSignature: TimeSignature;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * 音軌狀態
 * Track state
 */
export interface TrackState {
    id: string;
    name: string;
    volume: number;
    pan: number;
    isMuted: boolean;
    isSoloed: boolean;
    effects: EffectState[];
}

/**
 * 片段狀態
 * Clip state
 */
export interface ClipState {
    id: string;
    trackId: string;
    audioUrl: string;
    startTime: number;
    duration: number;
    offset: number;
}

/**
 * UI 狀態
 * UI state
 */
export interface UIState {
    selectedTrackId: string | null;
    selectedClipId: string | null;
    timelinePosition: number;
    zoom: number;
    isPlaying: boolean;
    isRecording: boolean;
}

/**
 * 音頻狀態
 * Audio state
 */
export interface AudioState {
    masterVolume: number;
    isAudioContextInitialized: boolean;
    sampleRate: number;
    bufferSize: number;
}

/**
 * 應用狀態
 * Application state
 */
export interface AppState {
    project: ProjectState;
    tracks: TrackState[];
    clips: ClipState[];
    ui: UIState;
    audio: AudioState;
}

/**
 * 使用者設定
 * User settings
 */
export interface UserSettings {
    theme: 'light' | 'dark';
    shortcuts: Record<string, string>;
    audioSettings: AudioSettings;
}

/**
 * 音頻設定
 * Audio settings
 */
export interface AudioSettings {
    sampleRate: number;
    bufferSize: number;
    latencyHint: number;
}

/**
 * 持久化狀態
 * Persistent state
 */
export interface PersistentState {
    project: ProjectState;
    tracks: TrackState[];
    clips: ClipState[];
    settings: UserSettings;
}

/**
 * 狀態訂閱者
 * State subscriber
 */
export interface StateSubscriber {
    onStateChanged(state: AppState): void | Promise<void>;
}

/**
 * 狀態管理器介面
 * State manager interface
 */
export interface IStateManager extends IService {
    /**
     * 獲取狀態
     * Get state using selector
     */
    getState<T>(selector: (state: AppState) => T): T;

    /**
     * 更新狀態
     * Update state
     */
    updateState(updater: (state: AppState) => Partial<AppState>): Promise<void>;

    /**
     * 批量更新狀態
     * Batch update state
     */
    batchUpdate(updates: Partial<AppState>[]): Promise<void>;

    /**
     * 訂閱狀態變更
     * Subscribe to state changes
     */
    subscribe(subscriber: StateSubscriber): void;

    /**
     * 取消訂閱狀態變更
     * Unsubscribe from state changes
     */
    unsubscribe(subscriber: StateSubscriber): void;

    /**
     * 持久化狀態
     * Persist state
     */
    persistState(): Promise<void>;

    /**
     * 載入持久化狀態
     * Load persisted state
     */
    loadPersistedState(): Promise<PersistentState | null>;

    /**
     * 驗證狀態
     * Validate state
     */
    validateState(): boolean;

    /**
     * 恢復到最後的有效狀態
     * Restore to last valid state
     */
    restoreLastValidState(): Promise<void>;

    /**
     * 清理舊數據
     * Clean up old data
     */
    cleanupOldData(): Promise<void>;

    /**
     * 同步狀態
     * Synchronize state
     */
    synchronize(): Promise<void>;

    /**
     * 重置狀態
     * Reset state
     */
    resetState(): Promise<void>;
} 