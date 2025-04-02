import { Event } from './Event';
import { ErrorHandler } from '../error/ErrorHandler';
import { injectable } from 'inversify';
import { EventPayload, EventHandlerOptions, EventFilter } from './types';
import { EventPriority } from './EventPriority';

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

export interface IEventBus {
    on<T extends keyof EventPayload>(type: T, handler: (payload: EventPayload[T]) => void, options?: EventHandlerOptions): void;
    off<T extends keyof EventPayload>(type: T, handler: (payload: EventPayload[T]) => void): void;
    emit<T extends keyof EventPayload>(type: T, payload: EventPayload[T]): void;
}

@injectable()
export class EventBusImpl implements IEventBus {
    private static instance: EventBusImpl | null = null;
    private handlers: Map<string, Set<Function>> = new Map();
    private filters: Map<string, EventFilter<any>> = new Map();
    private isDebugMode: boolean = false;
    private errorHandler: ErrorHandler;
    
    constructor() {
        this.errorHandler = ErrorHandler.getInstance();
    }
    
    public static getInstance(): EventBusImpl {
        if (!EventBusImpl.instance) {
            EventBusImpl.instance = new EventBusImpl();
        }
        return EventBusImpl.instance;
    }

    onInit(): void {
        // No initialization needed
    }

    onDestroy(): void {
        this.destroy();
    }
    
    public on<T extends keyof EventPayload>(
        type: T,
        handler: (payload: EventPayload[T]) => void,
        options: EventHandlerOptions = {}
    ): void {
        if (!this.handlers.has(type)) {
            this.handlers.set(type, new Set());
        }
        this.handlers.get(type)?.add(handler);
    }
    
    public off<T extends keyof EventPayload>(
        type: T,
        handler: (payload: EventPayload[T]) => void
    ): void {
        this.handlers.get(type)?.delete(handler);
    }
    
    public emit<T extends keyof EventPayload>(
        type: T,
        payload: EventPayload[T]
    ): void {
        const handlers = this.handlers.get(type);
        if (!handlers) return;

        const filter = this.filters.get(type);
        if (filter && !filter.shouldProcess(payload)) return;

        handlers.forEach(handler => {
            try {
                handler(payload);
            } catch (error) {
                console.error(`Error handling event ${type}:`, error);
            }
        });
    }
    
    public setFilter<T extends keyof EventPayload>(
        type: T,
        filter: EventFilter<EventPayload[T]>
    ): void {
        this.filters.set(type, filter);
    }
    
    public removeFilter<T extends keyof EventPayload>(type: T): void {
        this.filters.delete(type);
    }
    
    // Set debug mode
    setDebugMode(enabled: boolean): void {
        this.isDebugMode = enabled;
    }
    
    // Handle event synchronously
    private handleEvent(event: Event, priority: EventPriority): void {
        const handlers = this.handlers.get(event.type as string);
        if (!handlers) return;
        
        if (this.isDebugMode) {
            console.debug(`[EventBus] Handling event: ${event.type}`, event.data);
        }
        
        handlers.forEach(handler => {
            try {
                handler(event.data as EventPayload[keyof EventPayload]);
            } catch (error) {
                this.errorHandler.handleError(new Error('Listener error'));
            }
        });
    }
    
    // Handle event asynchronously
    private async handleEventAsync(event: Event, priority: EventPriority): Promise<void> {
        const handlers = this.handlers.get(event.type as string);
        if (!handlers) return;
        
        if (this.isDebugMode) {
            console.debug(`[EventBus] Handling async event: ${event.type}`, event.data);
        }
        
        await Promise.all(
            Array.from(handlers).map(handler =>
                Promise.resolve(handler(event.data as EventPayload[keyof EventPayload])).catch(error =>
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
    
    public destroy(): void {
        this.handlers.clear();
        this.filters.clear();
        EventBusImpl.instance = null;
    }
} 