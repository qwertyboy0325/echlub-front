import { injectable } from 'inversify';
import { EventBus } from './EventBus';
import { EventPayload } from './types';

@injectable()
export class BatchedEventBus implements EventBus {
    private eventQueue: Map<string, EventPayload[]> = new Map();
    private processingTimeout: NodeJS.Timeout | null = null;
    private readonly BATCH_DELAY = 16; // 約60fps
    
    constructor(private eventBus: EventBus) {}
    
    on<T extends keyof EventPayload>(event: T, handler: (payload: EventPayload[T]) => void): void {
        this.eventBus.on(event, handler);
    }
    
    off<T extends keyof EventPayload>(event: T, handler: (payload: EventPayload[T]) => void): void {
        this.eventBus.off(event, handler);
    }
    
    emit<T extends keyof EventPayload>(event: T, payload: EventPayload[T]): void {
        if (!this.eventQueue.has(event)) {
            this.eventQueue.set(event, []);
        }
        
        this.eventQueue.get(event)!.push(payload);
        this.scheduleProcessing();
    }
    
    private scheduleProcessing(): void {
        if (this.processingTimeout) {
            return;
        }
        
        this.processingTimeout = setTimeout(() => {
            this.processBatch();
            this.processingTimeout = null;
        }, this.BATCH_DELAY);
    }
    
    private processBatch(): void {
        for (const [event, payloads] of this.eventQueue.entries()) {
            if (payloads.length > 0) {
                // 合併相同事件的payload
                const mergedPayload = this.mergePayloads(event, payloads);
                this.eventBus.emit(event, mergedPayload);
                payloads.length = 0;
            }
        }
    }
    
    private mergePayloads<T extends keyof EventPayload>(event: T, payloads: EventPayload[T][]): EventPayload[T] {
        // 根據事件類型實現不同的合併邏輯
        switch (event) {
            case 'domain:track:created':
                return {
                    track: payloads[payloads.length - 1].track
                } as EventPayload[T];
            
            case 'domain:transport:state:changed':
                return {
                    state: payloads[payloads.length - 1].state
                } as EventPayload[T];
            
            case 'domain:transport:bpm:changed':
                return {
                    bpm: payloads[payloads.length - 1].bpm
                } as EventPayload[T];
            
            default:
                return payloads[payloads.length - 1];
        }
    }
} 