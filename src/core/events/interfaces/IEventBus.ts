import { EventType } from '../constants/EventTypes';
import { IService } from '../../di/interfaces/IService';

/**
 * 事件處理器類型
 * Event handler type
 */
export type EventHandler<T = any> = (data: T) => void | Promise<void>;

/**
 * 事件匯流排介面
 * Event bus interface
 */
export interface IEventBus extends IService {
    /**
     * 訂閱事件
     * Subscribe to an event
     * @param event 事件類型
     * @param handler 事件處理器
     */
    on<T>(event: EventType, handler: EventHandler<T>): void;

    /**
     * 取消訂閱事件
     * Unsubscribe from an event
     * @param event 事件類型
     * @param handler 事件處理器
     */
    off<T>(event: EventType, handler: EventHandler<T>): void;

    /**
     * 訂閱一次性事件
     * Subscribe to an event once
     * @param event 事件類型
     * @param handler 事件處理器
     */
    once<T>(event: EventType, handler: EventHandler<T>): void;

    /**
     * 發送事件
     * Emit an event
     * @param event 事件類型
     * @param data 事件數據
     */
    emit<T>(event: EventType, data?: T): Promise<void>;

    /**
     * 清除所有事件訂閱
     * Clear all event subscriptions
     */
    clear(): void;

    /**
     * 獲取特定事件的訂閱者數量
     * Get the number of subscribers for a specific event
     * @param event 事件類型
     */
    getSubscriberCount(event: EventType): number;

    /**
     * 檢查是否有訂閱者
     * Check if there are any subscribers
     * @param event 事件類型
     */
    hasSubscribers(event: EventType): boolean;
} 