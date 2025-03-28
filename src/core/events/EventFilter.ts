import { Event } from './Event';
import { ErrorHandler } from '../error/ErrorHandler';

/**
 * Event Filter
 * Filters events based on type and conditions
 */
export class EventFilter {
    private static instance: EventFilter | null = null;
    private filters: Map<string, ((event: Event) => boolean)[]> = new Map();
    private errorHandler: ErrorHandler;
    
    private constructor() {
        this.errorHandler = ErrorHandler.getInstance();
    }
    
    static getInstance(): EventFilter {
        if (!EventFilter.instance) {
            EventFilter.instance = new EventFilter();
        }
        return EventFilter.instance;
    }
    
    addFilter(type: string, filter: (event: Event) => boolean): void {
        if (!this.filters.has(type)) {
            this.filters.set(type, []);
        }
        this.filters.get(type)?.push(filter);
    }
    
    removeFilter(type: string): void {
        this.filters.delete(type);
    }
    
    shouldProcess(event: Event): boolean {
        const filters = this.filters.get(event.type);
        if (!filters || filters.length === 0) return true;
        
        try {
            return filters.every(filter => filter(event));
        } catch (error) {
            this.errorHandler.handleError(new Error(`Error in event filter for ${event.type}: ${error instanceof Error ? error.message : String(error)}`));
            return false;
        }
    }
    
    destroy(): void {
        this.filters.clear();
        EventFilter.instance = null;
    }
} 