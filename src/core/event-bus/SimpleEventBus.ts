import { injectable } from 'inversify';
import { IEventBus } from './IEventBus';

@injectable()
export class SimpleEventBus implements IEventBus {
  private handlers: Map<string, Set<(payload: any) => void>> = new Map();
  
  async emit(eventName: string, payload: any): Promise<void> {
    const handlers = this.handlers.get(eventName);
    if (handlers) {
      for (const handler of handlers) {
        try {
          await handler(payload);
        } catch (error) {
          console.error(`Error in event handler for ${eventName}:`, error);
        }
      }
    }
  }
  
  on(eventName: string, handler: (payload: any) => void): void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, new Set());
    }
    this.handlers.get(eventName)!.add(handler);
  }
  
  off(eventName: string, handler: (payload: any) => void): void {
    const handlers = this.handlers.get(eventName);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlers.delete(eventName);
      }
    }
  }
  
  once(eventName: string, handler: (payload: any) => void): void {
    const onceHandler = (payload: any) => {
      this.off(eventName, onceHandler);
      handler(payload);
    };
    this.on(eventName, onceHandler);
  }
  
  async publish(event: any): Promise<void> {
    const eventType = event.type || 'generic';
    await this.emit(eventType, event);
  }
} 
