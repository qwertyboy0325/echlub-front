import { Event } from './Event';
import { ErrorHandler } from '../error/ErrorHandler';
import { IEventBus } from '../di/types';

/**
 * Event Priority Levels
 */
export enum EventPriority {
    LOW = 0,
    NORMAL = 1,
    HIGH = 2,
    CRITICAL = 3
}

/**
 * Event Handler Type
 */
export type EventHandler<T = any> = (event: Event<T>) => void | Promise<void>;

/**
 * Event Bus
 * Manages event emission and subscription
 */
export class EventBus<T extends Record<string, any>> implements IEventBus {
    private static instance: EventBus<any> | null = null;
    private handlers: Map<string, Set<EventHandler<any>>> = new Map();
    private isDebugMode: boolean = false;
    private errorHandler: ErrorHandler;
    
    constructor() {
        this.errorHandler = ErrorHandler.getInstance();
    }
    
    static getInstance<T extends Record<string, any>>(): EventBus<T> {
        if (!EventBus.instance) {
            EventBus.instance = new EventBus<T>();
        }
        return EventBus.instance as EventBus<T>;
    }

    onInit(): void {
        // No initialization needed
    }

    onDestroy(): void {
        this.destroy();
    }
    
    // Emit event synchronously
    emit(type: string, payload: any, priority: EventPriority = EventPriority.NORMAL): void {
        const event = new Event(type, payload);
        this.handleEvent(event, priority);
    }
    
    // Emit event asynchronously
    async emitAsync<K extends keyof T>(type: K, payload: T[K], priority: EventPriority = EventPriority.NORMAL): Promise<void> {
        const event = new Event(type as string, payload);
        await this.handleEventAsync(event, priority);
    }
    
    // Subscribe to event
    subscribe(type: string, handler: (event: any) => void, priority: EventPriority = EventPriority.NORMAL): void {
        if (!this.handlers.has(type)) {
            this.handlers.set(type, new Set());
        }
        this.handlers.get(type)?.add(handler);
    }
    
    // Unsubscribe from event
    unsubscribe(type: string, handler: (event: any) => void): void {
        this.handlers.get(type)?.delete(handler);
    }
    
    // Set debug mode
    setDebugMode(enabled: boolean): void {
        this.isDebugMode = enabled;
    }
    
    // Handle event synchronously
    private handleEvent(event: Event, priority: EventPriority): void {
        const handlers = this.handlers.get(event.type);
        if (!handlers) return;
        
        if (this.isDebugMode) {
            console.debug(`[EventBus] Handling event: ${event.type}`, event.data);
        }
        
        handlers.forEach(handler => {
            try {
                handler(event);
            } catch (error) {
                this.errorHandler.handleError(new Error('Listener error'));
            }
        });
    }
    
    // Handle event asynchronously
    private async handleEventAsync(event: Event, priority: EventPriority): Promise<void> {
        const handlers = this.handlers.get(event.type);
        if (!handlers) return;
        
        if (this.isDebugMode) {
            console.debug(`[EventBus] Handling async event: ${event.type}`, event.data);
        }
        
        await Promise.all(
            Array.from(handlers).map(handler =>
                Promise.resolve(handler(event)).catch(error =>
                    this.errorHandler.handleError(new Error('Listener error'))
                )
            )
        );
    }
    
    // Execute handler with retry
    private async executeWithRetry<T>(
        handler: EventHandler<T>,
        payload: T,
        config: { maxRetries?: number; delay?: number } = {}
    ): Promise<void> {
        const { maxRetries = 3, delay = 1000 } = config;
        let retries = 0;
        
        while (retries < maxRetries) {
            try {
                await handler(new Event('retry', payload));
                return;
            } catch (error) {
                retries++;
                if (retries === maxRetries) {
                    this.errorHandler.handleError(new Error('Listener error'));
                }
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    destroy(): void {
        this.handlers.clear();
        EventBus.instance = null;
    }
} 