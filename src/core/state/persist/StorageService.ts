import { injectable } from 'inversify';
import { BaseService } from '../../di/abstracts/BaseService';
import { PersistentState } from '../interfaces/IStateManager';

/**
 * 存儲服務
 * Storage service for state persistence
 */
@injectable()
export class StorageService extends BaseService {
    private readonly PREFIX = 'echlub_';
    private readonly STATE_KEY = 'state';
    private readonly MAX_HISTORY = 5;

    /**
     * 保存狀態
     * Save state to storage
     */
    async saveState(state: PersistentState): Promise<void> {
        try {
            // 保存當前狀態
            const serialized = JSON.stringify(state);
            localStorage.setItem(
                this.getKey(this.STATE_KEY),
                serialized
            );

            // 保存歷史記錄
            await this.saveToHistory(state);
        } catch (error) {
            console.error('Failed to save state:', error);
            throw new Error('State persistence failed');
        }
    }

    /**
     * 載入狀態
     * Load state from storage
     */
    async loadState(): Promise<PersistentState | null> {
        try {
            const serialized = localStorage.getItem(
                this.getKey(this.STATE_KEY)
            );
            return serialized ? JSON.parse(serialized) : null;
        } catch (error) {
            console.error('Failed to load state:', error);
            return null;
        }
    }

    /**
     * 載入歷史狀態
     * Load historical state
     */
    async loadHistoryState(index: number): Promise<PersistentState | null> {
        try {
            const key = this.getHistoryKey(index);
            const serialized = localStorage.getItem(key);
            return serialized ? JSON.parse(serialized) : null;
        } catch (error) {
            console.error('Failed to load history state:', error);
            return null;
        }
    }

    /**
     * 清理存儲
     * Clean up storage
     */
    async cleanup(): Promise<void> {
        try {
            // 清理過期的歷史記錄
            for (let i = this.MAX_HISTORY; i < 100; i++) {
                const key = this.getHistoryKey(i);
                localStorage.removeItem(key);
            }

            // 清理其他過期數據
            const keys = Object.keys(localStorage);
            const oldKeys = keys.filter(key => 
                key.startsWith(this.PREFIX) && 
                this.isExpired(key)
            );

            oldKeys.forEach(key => localStorage.removeItem(key));
        } catch (error) {
            console.error('Failed to cleanup storage:', error);
        }
    }

    /**
     * 初始化存儲服務
     * Initialize storage service
     */
    protected async onInitialize(): Promise<void> {
        // 檢查 localStorage 是否可用
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
        } catch (error) {
            throw new Error('LocalStorage is not available');
        }
    }

    /**
     * 銷毀存儲服務
     * Destroy storage service
     */
    protected async onDestroy(): Promise<void> {
        // 不需要特別的清理操作
    }

    /**
     * 保存到歷史記錄
     * Save to history
     */
    private async saveToHistory(state: PersistentState): Promise<void> {
        try {
            // 移動現有歷史記錄
            for (let i = this.MAX_HISTORY - 1; i > 0; i--) {
                const prevKey = this.getHistoryKey(i - 1);
                const nextKey = this.getHistoryKey(i);
                const value = localStorage.getItem(prevKey);
                if (value) {
                    localStorage.setItem(nextKey, value);
                }
            }

            // 保存新的歷史記錄
            const serialized = JSON.stringify({
                ...state,
                timestamp: new Date().toISOString()
            });
            localStorage.setItem(this.getHistoryKey(0), serialized);
        } catch (error) {
            console.error('Failed to save history:', error);
        }
    }

    /**
     * 獲取完整的存儲鍵名
     * Get full storage key
     */
    private getKey(key: string): string {
        return `${this.PREFIX}${key}`;
    }

    /**
     * 獲取歷史記錄的鍵名
     * Get history key
     */
    private getHistoryKey(index: number): string {
        return this.getKey(`history_${index}`);
    }

    /**
     * 檢查數據是否過期
     * Check if data is expired
     */
    private isExpired(key: string): boolean {
        try {
            const data = localStorage.getItem(key);
            if (!data) return true;

            const parsed = JSON.parse(data);
            if (!parsed.timestamp) return true;

            const timestamp = new Date(parsed.timestamp);
            const now = new Date();
            const diff = now.getTime() - timestamp.getTime();
            const days = diff / (1000 * 60 * 60 * 24);

            return days > 30; // 30天後過期
        } catch {
            return true;
        }
    }
} 