export type EventHandler<T = any> = (payload: T, eventName?: string) => void;

export class EventEmitter<T = any> {
  private events: Map<keyof T | '*', EventHandler<T[keyof T]>[]> = new Map();
  private maxListeners: number = 10;

  setMaxListeners(n: number): void {
    this.maxListeners = n;
  }

  on<K extends keyof T>(event: K | '*', handler: EventHandler<T[K]>): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    const handlers = this.events.get(event);
    if (handlers && handlers.length < this.maxListeners) {
      handlers.push(handler as EventHandler<T[keyof T]>);
    }
  }

  once<K extends keyof T>(event: K | '*', handler: EventHandler<T[K]>): void {
    const onceHandler: EventHandler<T[K]> = (payload: T[K], eventName?: string) => {
      handler(payload, eventName);
      this.off(event, onceHandler);
    };
    this.on(event, onceHandler);
  }

  off<K extends keyof T>(event: K | '*', handler: EventHandler<T[K]>): void {
    const handlers = this.events.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler as EventHandler<T[keyof T]>);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  emit<K extends keyof T>(event: K, payload: T[K]): void {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(payload, String(event)));
    }

    const wildcardHandlers = this.events.get('*');
    if (wildcardHandlers) {
      wildcardHandlers.forEach(handler => handler(payload, String(event)));
    }
  }

  removeAllListeners(event?: keyof T | '*'): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }
} 