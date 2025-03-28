/**
 * Event
 * Represents an event in the system
 */
export class Event<T = any> {
    constructor(
        public readonly type: string,
        public readonly data: T,
        public readonly timestamp: number = Date.now()
    ) {}
    
    toString(): string {
        return `Event[${this.type}](${JSON.stringify(this.data)})`;
    }
} 