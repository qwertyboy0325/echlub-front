import { Event } from './Event';

/**
 * Event Log Entry
 * Represents a logged event with metadata
 */
export interface EventLogEntry {
    event: Event;
    timestamp: number;
    priority: number;
    severity: 'info' | 'warning' | 'error';
} 