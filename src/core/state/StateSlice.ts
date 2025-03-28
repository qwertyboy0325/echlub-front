import { StateStore } from './StateStore';
import { ErrorHandler } from '../error/ErrorHandler';

/**
 * State Slice
 * Manages a portion of application state
 */
export class StateSlice<T extends object> {
    private state: T;
    private subscribers: Set<(state: T) => void> = new Set();
    private errorHandler: ErrorHandler;
    
    constructor(
        private readonly name: string,
        initialState: T
    ) {
        this.state = initialState;
        this.errorHandler = ErrorHandler.getInstance();
    }
    
    getState(): T {
        return this.state;
    }
    
    setState(newState: T): void {
        this.state = newState;
        this.notifySubscribers();
    }
    
    setPartialState<K extends keyof T>(key: K, value: T[K]): void {
        this.state = {
            ...this.state,
            [key]: value
        };
        this.notifySubscribers();
    }
    
    subscribe(subscriber: (state: T) => void): () => void {
        this.subscribers.add(subscriber);
        return () => this.subscribers.delete(subscriber);
    }
    
    private notifySubscribers(): void {
        this.subscribers.forEach(subscriber => {
            try {
                subscriber(this.state);
            } catch (error) {
                this.errorHandler.handleError(new Error(`Subscriber error`));
            }
        });
    }
} 