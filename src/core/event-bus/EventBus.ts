import { injectable } from 'inversify';
import { IEventBus } from './IEventBus';

@injectable()
export class EventBus implements IEventBus {
  private handlers: Map<string, Set<(payload: any) => void>> = new Map();

  async emit(eventName: string, payload: any): Promise<void> {
    const handlers = this.handlers.get(eventName);
    if (!handlers) return;

    for (const handler of handlers) {
      try {
        handler(payload);
      } catch (error) {
        console.error(`Error in event handler for ${eventName}:`, error);
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
    }
  }

  once(eventName: string, handler: (payload: any) => void): void {
    const onceHandler = (payload: any) => {
      handler(payload);
      this.off(eventName, onceHandler);
    };
    this.on(eventName, onceHandler);
  }

  async publish(event: any): Promise<void> {
    // Assuming the event has an eventType property to determine which handlers to call
    if (event && event.eventType) {
      return this.emit(event.eventType, event);
    } else {
      console.error('Invalid event format: missing eventType property', event);
    }
  }
} 
