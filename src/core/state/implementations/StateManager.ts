import { injectable, inject } from 'inversify';
import { BaseService } from '../../di/abstracts/BaseService';
import type { IStateManager, AppState, StateSubscriber, PersistentState } from '../interfaces/IStateManager';
import type { StorageService } from '../persist/StorageService';
import type { IEventBus } from '../../events/interfaces/IEventBus';
import { SystemEventTypes } from '../../events/constants/EventTypes';
import { TYPES } from '../../di/types';

/**
 * 狀態管理器實現
 * State manager implementation
 */
@injectable()
export class StateManager extends BaseService implements IStateManager {
    private state: AppState;
    private subscribers: Set<StateSubscriber> = new Set();
    private stateHistory: AppState[] = [];
    private readonly MAX_HISTORY_SIZE = 10;
    private updateQueue: Partial<AppState>[] = [];
    private isUpdating: boolean = false;

    constructor(
        @inject(TYPES.StorageService) private storage: StorageService,
        @inject(TYPES.EventBus) private eventBus: IEventBus
    ) {
        super();
        this.state = this.getInitialState();
    }

    /**
     * 獲取狀態
     * Get state using selector
     */
    public getState<T>(selector: (state: AppState) => T): T {
        return selector(this.state);
    }

    /**
     * 更新狀態
     * Update state
     */
    public async updateState(updater: (state: AppState) => Partial<AppState>): Promise<void> {
        try {
            // 保存當前狀態到歷史記錄
            this.pushToHistory();

            // 更新狀態
            const updates = updater(this.state);
            this.state = { ...this.state, ...updates };

            // 驗證新狀態
            if (!this.validateState()) {
                throw new Error('Invalid state after update');
            }

            // 通知訂閱者
            await this.notifySubscribers();

            // 持久化狀態
            await this.persistState();

            // 發送狀態變更事件
            await this.eventBus.emit(SystemEventTypes.STATE_CHANGED, {
                type: 'state_updated',
                changes: updates
            });
        } catch (error) {
            // 恢復到上一個狀態
            await this.restoreLastValidState();
            throw error;
        }
    }

    /**
     * 批量更新狀態
     * Batch update state
     */
    public async batchUpdate(updates: Partial<AppState>[]): Promise<void> {
        this.updateQueue.push(...updates);
        if (!this.isUpdating) {
            await this.processUpdateQueue();
        }
    }

    /**
     * 訂閱狀態變更
     * Subscribe to state changes
     */
    public subscribe(subscriber: StateSubscriber): void {
        this.subscribers.add(subscriber);
    }

    /**
     * 取消訂閱狀態變更
     * Unsubscribe from state changes
     */
    public unsubscribe(subscriber: StateSubscriber): void {
        this.subscribers.delete(subscriber);
    }

    /**
     * 持久化狀態
     * Persist state
     */
    public async persistState(): Promise<void> {
        const persistentState: PersistentState = {
            project: this.state.project,
            tracks: this.state.tracks,
            clips: this.state.clips,
            settings: {
                theme: 'light',  // 從配置中獲取
                shortcuts: {},   // 從配置中獲取
                audioSettings: {
                    sampleRate: this.state.audio.sampleRate,
                    bufferSize: this.state.audio.bufferSize,
                    latencyHint: 0
                }
            }
        };

        await this.storage.saveState(persistentState);
    }

    /**
     * 載入持久化狀態
     * Load persisted state
     */
    public async loadPersistedState(): Promise<PersistentState | null> {
        return await this.storage.loadState();
    }

    /**
     * 驗證狀態
     * Validate state
     */
    public validateState(): boolean {
        // 基本驗證
        if (!this.state.project || !this.state.ui || !this.state.audio) {
            return false;
        }

        // 驗證必要字段
        if (!this.state.project.id || !this.state.project.name) {
            return false;
        }

        // 驗證數值範圍
        if (this.state.project.bpm <= 0 || this.state.audio.masterVolume < 0) {
            return false;
        }

        // 驗證數組引用完整性
        const trackIds = new Set(this.state.tracks.map(t => t.id));
        const invalidClips = this.state.clips.some(c => !trackIds.has(c.trackId));
        if (invalidClips) {
            return false;
        }

        return true;
    }

    /**
     * 恢復到最後的有效狀態
     * Restore to last valid state
     */
    public async restoreLastValidState(): Promise<void> {
        if (this.stateHistory.length > 0) {
            this.state = this.stateHistory.pop()!;
            await this.notifySubscribers();
        } else {
            // 如果沒有歷史記錄，嘗試從存儲加載
            const persisted = await this.loadPersistedState();
            if (persisted) {
                this.state = this.convertToAppState(persisted);
                await this.notifySubscribers();
            } else {
                // 最後的選擇：重置到初始狀態
                await this.resetState();
            }
        }
    }

    /**
     * 清理舊數據
     * Clean up old data
     */
    public async cleanupOldData(): Promise<void> {
        // 清理歷史記錄
        while (this.stateHistory.length > this.MAX_HISTORY_SIZE) {
            this.stateHistory.shift();
        }

        // 清理存儲中的舊數據
        await this.storage.cleanup();
    }

    /**
     * 同步狀態
     * Synchronize state
     */
    public async synchronize(): Promise<void> {
        try {
            const persisted = await this.loadPersistedState();
            if (persisted) {
                const merged = this.mergeStates(this.state, this.convertToAppState(persisted));
                if (this.validateMergedState(merged)) {
                    this.state = merged;
                    await this.notifySubscribers();
                    await this.persistState();
                }
            }
        } catch (error) {
            await this.eventBus.emit(SystemEventTypes.ERROR, {
                type: 'sync_error',
                error: error instanceof Error ? error : new Error(String(error))
            });
        }
    }

    /**
     * 重置狀態
     * Reset state
     */
    public async resetState(): Promise<void> {
        this.state = this.getInitialState();
        this.stateHistory = [];
        await this.notifySubscribers();
        await this.persistState();
    }

    /**
     * 初始化狀態管理器
     * Initialize state manager
     */
    protected async onInitialize(): Promise<void> {
        // 載入持久化狀態
        const persisted = await this.loadPersistedState();
        if (persisted) {
            this.state = this.convertToAppState(persisted);
        }

        // 設置事件監聽器
        this.eventBus.on(SystemEventTypes.ERROR, this.handleError);
    }

    /**
     * 銷毀狀態管理器
     * Destroy state manager
     */
    protected async onDestroy(): Promise<void> {
        // 清理訂閱者
        this.subscribers.clear();
        this.stateHistory = [];

        // 移除事件監聽器
        this.eventBus.off(SystemEventTypes.ERROR, this.handleError);
    }

    /**
     * 獲取初始狀態
     * Get initial state
     */
    private getInitialState(): AppState {
        return {
            project: {
                id: '',
                name: 'New Project',
                bpm: 120,
                timeSignature: { numerator: 4, denominator: 4 },
                createdAt: new Date(),
                updatedAt: new Date()
            },
            tracks: [],
            clips: [],
            ui: {
                selectedTrackId: null,
                selectedClipId: null,
                timelinePosition: 0,
                zoom: 1,
                isPlaying: false,
                isRecording: false
            },
            audio: {
                masterVolume: 1,
                isAudioContextInitialized: false,
                sampleRate: 44100,
                bufferSize: 1024
            }
        };
    }

    /**
     * 處理錯誤
     * Handle error
     */
    private handleError = async (error: Error): Promise<void> => {
        console.error('State manager error:', error);
        await this.restoreLastValidState();
    };

    /**
     * 通知訂閱者
     * Notify subscribers
     */
    private async notifySubscribers(): Promise<void> {
        const promises: Promise<void>[] = [];
        for (const subscriber of this.subscribers) {
            try {
                const result = subscriber.onStateChanged(this.state);
                if (result instanceof Promise) {
                    promises.push(result);
                }
            } catch (error) {
                console.error('Error in state subscriber:', error);
            }
        }
        if (promises.length > 0) {
            await Promise.all(promises);
        }
    }

    /**
     * 保存到歷史記錄
     * Save to history
     */
    private pushToHistory(): void {
        this.stateHistory.push({ ...this.state });
        if (this.stateHistory.length > this.MAX_HISTORY_SIZE) {
            this.stateHistory.shift();
        }
    }

    /**
     * 處理更新隊列
     * Process update queue
     */
    private async processUpdateQueue(): Promise<void> {
        this.isUpdating = true;
        try {
            while (this.updateQueue.length > 0) {
                const updates = this.updateQueue.splice(0, 10);
                const mergedUpdate = this.mergeUpdates(updates);
                await this.updateState(() => mergedUpdate);
            }
        } finally {
            this.isUpdating = false;
        }
    }

    /**
     * 合併更新
     * Merge updates
     */
    private mergeUpdates(updates: Partial<AppState>[]): Partial<AppState> {
        return updates.reduce((merged, update) => ({
            ...merged,
            ...update
        }), {});
    }

    /**
     * 合併狀態
     * Merge states
     */
    private mergeStates(local: AppState, remote: AppState): AppState {
        return {
            ...local,
            ...remote,
            tracks: this.mergeArrays(local.tracks, remote.tracks, 'id'),
            clips: this.mergeArrays(local.clips, remote.clips, 'id')
        };
    }

    /**
     * 合併數組
     * Merge arrays
     */
    private mergeArrays<T extends { id: string }>(
        local: T[],
        remote: T[],
        key: keyof T
    ): T[] {
        const merged = new Map<string, T>();
        
        // 添加本地項
        local.forEach(item => merged.set(item.id, item));
        
        // 合併遠端項
        remote.forEach(item => {
            const localItem = merged.get(item.id);
            if (localItem) {
                // 如果遠端項更新，使用遠端版本
                merged.set(item.id, item);
            } else {
                // 添加新項
                merged.set(item.id, item);
            }
        });

        return Array.from(merged.values());
    }

    /**
     * 驗證合併後的狀態
     * Validate merged state
     */
    private validateMergedState(state: AppState): boolean {
        // 執行基本驗證
        if (!this.validateState()) {
            return false;
        }

        // 驗證合併後的關係完整性
        const trackIds = new Set(state.tracks.map(t => t.id));
        const clipTrackIds = new Set(state.clips.map(c => c.trackId));

        // 確保所有 clip 都有對應的 track
        for (const trackId of clipTrackIds) {
            if (!trackIds.has(trackId)) {
                return false;
            }
        }

        return true;
    }

    /**
     * 將持久化狀態轉換為應用狀態
     * Convert persistent state to app state
     */
    private convertToAppState(persisted: PersistentState): AppState {
        return {
            project: persisted.project,
            tracks: persisted.tracks,
            clips: persisted.clips,
            ui: {
                selectedTrackId: null,
                selectedClipId: null,
                timelinePosition: 0,
                zoom: 1,
                isPlaying: false,
                isRecording: false
            },
            audio: {
                masterVolume: 1,
                isAudioContextInitialized: false,
                sampleRate: persisted.settings.audioSettings.sampleRate,
                bufferSize: persisted.settings.audioSettings.bufferSize
            }
        };
    }
} 