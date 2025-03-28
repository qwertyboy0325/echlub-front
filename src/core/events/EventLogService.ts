import { Event } from './Event';
import { EventLogEntry } from './EventLogEntry';

/**
 * Event Log Service
 * Manages event logging and retrieval
 */
export class EventLogService {
    private static instance: EventLogService | null = null;
    private logs: EventLogEntry[] = [];
    private maxSize: number = 1000;
    
    private constructor() {}
    
    static getInstance(): EventLogService {
        if (!EventLogService.instance) {
            EventLogService.instance = new EventLogService();
        }
        return EventLogService.instance;
    }
    
    log(event: Event, priority: number = 0, severity: 'info' | 'warning' | 'error' = 'info'): void {
        const entry: EventLogEntry = {
            event,
            timestamp: Date.now(),
            priority,
            severity
        };
        
        this.logs.push(entry);
        
        // Maintain max size
        if (this.logs.length > this.maxSize) {
            this.logs = this.logs.slice(-this.maxSize);
        }
    }
    
    getLogs(): EventLogEntry[] {
        return [...this.logs];
    }
    
    getLogsByType(type: string): EventLogEntry[] {
        return this.logs.filter(entry => entry.event.type === type);
    }
    
    getLogsByTimeRange(startTime: number, endTime: number): EventLogEntry[] {
        return this.logs.filter(entry => 
            entry.timestamp >= startTime && entry.timestamp <= endTime
        );
    }
    
    getLogsBySeverity(severity: 'info' | 'warning' | 'error'): EventLogEntry[] {
        return this.logs.filter(entry => entry.severity === severity);
    }
    
    setMaxSize(size: number): void {
        this.maxSize = size;
        if (this.logs.length > size) {
            this.logs = this.logs.slice(-size);
        }
    }
    
    clear(): void {
        this.logs = [];
    }
    
    destroy(): void {
        this.clear();
        EventLogService.instance = null;
    }
} 