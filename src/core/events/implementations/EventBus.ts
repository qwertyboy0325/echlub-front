import { injectable } from 'inversify';
import { BaseService } from '../../di/abstracts/BaseService';
import { IEventBus, EventHandler } from '../interfaces/IEventBus';
import { EventType } from '../constants/EventTypes';

/**
 * 事件匯流排實現
 * Event bus implementation
 */
@injectable()
export class EventBus extends BaseService implements IEventBus {
    private handlers: Map<EventType, Set<EventHandler>> = new Map();
    private onceHandlers: Map<EventType, Set<EventHandler>> = new Map();

    /**
     * 訂閱事件
     * Subscribe to an event
     */
    public on<T>(event: EventType, handler: EventHandler<T>): void {
        if (!this.handlers.has(event)) {
            this.handlers.set(event, new Set());
        }
        this.handlers.get(event)!.add(handler);
    }

    /**
     * 取消訂閱事件
     * Unsubscribe from an event
     */
    public off<T>(event: EventType, handler: EventHandler<T>): void {
        const handlers = this.handlers.get(event);
        if (handlers) {
            handlers.delete(handler);
            if (handlers.size === 0) {
                this.handlers.delete(event);
            }
        }

        const onceHandlers = this.onceHandlers.get(event);
        if (onceHandlers) {
            onceHandlers.delete(handler);
            if (onceHandlers.size === 0) {
                this.onceHandlers.delete(event);
            }
        }
    }

    /**
     * 訂閱一次性事件
     * Subscribe to an event once
     */
    public once<T>(event: EventType, handler: EventHandler<T>): void {
        if (!this.onceHandlers.has(event)) {
            this.onceHandlers.set(event, new Set());
        }
        this.onceHandlers.get(event)!.add(handler);
    }

    /**
     * 發送事件
     * Emit an event
     */
    public async emit<T>(event: EventType, data?: T): Promise<void> {
        const handlers = this.handlers.get(event);
        const onceHandlers = this.onceHandlers.get(event);

        const promises: Promise<void>[] = [];

        // 處理常規訂閱者
        if (handlers) {
            for (const handler of handlers) {
                try {
                    const result = handler(data);
                    if (result instanceof Promise) {
                        promises.push(result);
                    }
                } catch (error) {
                    console.error(`Error in event handler for ${event}:`, error);
                }
            }
        }

        // 處理一次性訂閱者
        if (onceHandlers) {
            for (const handler of onceHandlers) {
                try {
                    const result = handler(data);
                    if (result instanceof Promise) {
                        promises.push(result);
                    }
                } catch (error) {
                    console.error(`Error in once event handler for ${event}:`, error);
                }
            }
            this.onceHandlers.delete(event);
        }

        // 等待所有異步處理完成
        if (promises.length > 0) {
            await Promise.all(promises);
        }
    }

    /**
     * 清除所有事件訂閱
     * Clear all event subscriptions
     */
    public clear(): void {
        this.handlers.clear();
        this.onceHandlers.clear();
    }

    /**
     * 獲取特定事件的訂閱者數量
     * Get the number of subscribers for a specific event
     */
    public getSubscriberCount(event: EventType): number {
        const handlers = this.handlers.get(event)?.size || 0;
        const onceHandlers = this.onceHandlers.get(event)?.size || 0;
        return handlers + onceHandlers;
    }

    /**
     * 檢查是否有訂閱者
     * Check if there are any subscribers
     */
    public hasSubscribers(event: EventType): boolean {
        return this.getSubscriberCount(event) > 0;
    }

    /**
     * 初始化事件匯流排
     * Initialize the event bus
     */
    protected async onInitialize(): Promise<void> {
        this.handlers = new Map();
        this.onceHandlers = new Map();
    }

    /**
     * 銷毀事件匯流排
     * Destroy the event bus
     */
    protected async onDestroy(): Promise<void> {
        this.clear();
    }
} 