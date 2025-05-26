import { injectable } from 'inversify';
import { IntegrationEvent } from './IntegrationEvent';

type EventHandler<T extends IntegrationEvent> = (event: T) => Promise<void> | void;

@injectable()
export class IntegrationEventBus {
  private handlers: Map<string, Set<EventHandler<any>>> = new Map();
  private namespaceSubscriptions: Map<string, Set<EventHandler<any>>> = new Map();

  async publish<T extends IntegrationEvent>(event: T): Promise<void> {
    const eventType = event.type;
    const namespace = eventType.split('.')[0];

    // Handle specific event subscribers
    const eventHandlers = this.handlers.get(eventType);
    if (eventHandlers) {
      await this.executeHandlers(eventHandlers, event);
    }

    // Handle namespace subscribers
    const namespaceHandlers = this.namespaceSubscriptions.get(namespace);
    if (namespaceHandlers) {
      await this.executeHandlers(namespaceHandlers, event);
    }
  }

  subscribe<T extends IntegrationEvent>(
    eventType: string,
    handler: EventHandler<T>
  ): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);
  }

  subscribeToNamespace<T extends IntegrationEvent>(
    namespace: string,
    handler: EventHandler<T>
  ): void {
    if (!this.namespaceSubscriptions.has(namespace)) {
      this.namespaceSubscriptions.set(namespace, new Set());
    }
    this.namespaceSubscriptions.get(namespace)!.add(handler);
  }

  unsubscribe<T extends IntegrationEvent>(
    eventType: string,
    handler: EventHandler<T>
  ): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlers.delete(eventType);
      }
    }
  }

  unsubscribeFromNamespace<T extends IntegrationEvent>(
    namespace: string,
    handler: EventHandler<T>
  ): void {
    const handlers = this.namespaceSubscriptions.get(namespace);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.namespaceSubscriptions.delete(namespace);
      }
    }
  }

  private async executeHandlers<T extends IntegrationEvent>(
    handlers: Set<EventHandler<T>>,
    event: T
  ): Promise<void> {
    for (const handler of handlers) {
      try {
        await Promise.resolve(handler(event));
      } catch (error) {
        console.error(`Error in event handler for ${event.type}:`, error);
      }
    }
  }
} 