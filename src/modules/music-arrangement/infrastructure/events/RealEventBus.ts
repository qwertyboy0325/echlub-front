import { DomainEvent } from '../../../../core/events/DomainEvent';
import { DomainError } from '../../domain/errors/DomainError';

/**
 * Event Handler Function
 */
export type EventHandler<T = any> = (event: T) => Promise<void> | void;

/**
 * Event Subscription
 */
export interface EventSubscription {
  id: string;
  eventType: string;
  handler: EventHandler;
  once: boolean;
  priority: number;
}

/**
 * Event Bus Configuration
 */
export interface EventBusConfig {
  maxListeners: number;
  enableLogging: boolean;
  errorHandler?: (error: Error, event: any) => void;
}

/**
 * Event Bus Statistics
 */
export interface EventBusStats {
  totalEvents: number;
  totalSubscriptions: number;
  eventsByType: Map<string, number>;
  errors: number;
  lastEventTime: Date | null;
}

/**
 * Real Event Bus
 * Provides actual event publishing and subscription functionality
 * Supports domain events, integration events, and real-time collaboration
 */
export class RealEventBus {
  private subscriptions: Map<string, EventSubscription[]> = new Map();
  private stats: EventBusStats = {
    totalEvents: 0,
    totalSubscriptions: 0,
    eventsByType: new Map(),
    errors: 0,
    lastEventTime: null
  };

  private config: EventBusConfig = {
    maxListeners: 100,
    enableLogging: true,
    errorHandler: (error, event) => {
      console.error('Event bus error:', error, 'Event:', event);
    }
  };

  private subscriptionIdCounter: number = 0;

  constructor(config?: Partial<EventBusConfig>) {
    this.config = { ...this.config, ...config };
  }

  /**
   * Subscribe to events
   */
  public subscribe<T = any>(
    eventType: string,
    handler: EventHandler<T>,
    options: {
      once?: boolean;
      priority?: number;
    } = {}
  ): string {
    try {
      // Check max listeners limit
      const existingSubscriptions = this.subscriptions.get(eventType) || [];
      if (existingSubscriptions.length >= this.config.maxListeners) {
        throw DomainError.operationNotPermitted(
          'subscribe',
          `Maximum listeners (${this.config.maxListeners}) exceeded for event type: ${eventType}`
        );
      }

      // Create subscription
      const subscription: EventSubscription = {
        id: `sub_${++this.subscriptionIdCounter}`,
        eventType,
        handler,
        once: options.once || false,
        priority: options.priority || 0
      };

      // Add to subscriptions
      if (!this.subscriptions.has(eventType)) {
        this.subscriptions.set(eventType, []);
      }

      const subscriptions = this.subscriptions.get(eventType)!;
      subscriptions.push(subscription);

      // Sort by priority (higher priority first)
      subscriptions.sort((a, b) => b.priority - a.priority);

      this.stats.totalSubscriptions++;

      if (this.config.enableLogging) {
        console.log(`Event subscription added: ${eventType} (${subscription.id})`);
      }

      return subscription.id;

    } catch (error) {
      console.error('Error subscribing to event:', error);
      throw error;
    }
  }

  /**
   * Subscribe to event once
   */
  public once<T = any>(eventType: string, handler: EventHandler<T>): string {
    return this.subscribe(eventType, handler, { once: true });
  }

  /**
   * Unsubscribe from events
   */
  public unsubscribe(subscriptionId: string): boolean {
    try {
      for (const [eventType, subscriptions] of this.subscriptions) {
        const index = subscriptions.findIndex(sub => sub.id === subscriptionId);
        if (index !== -1) {
          subscriptions.splice(index, 1);
          
          // Clean up empty event types
          if (subscriptions.length === 0) {
            this.subscriptions.delete(eventType);
          }

          this.stats.totalSubscriptions--;

          if (this.config.enableLogging) {
            console.log(`Event subscription removed: ${eventType} (${subscriptionId})`);
          }

          return true;
        }
      }

      return false;

    } catch (error) {
      console.error('Error unsubscribing from event:', error);
      return false;
    }
  }

  /**
   * Unsubscribe all handlers for an event type
   */
  public unsubscribeAll(eventType: string): number {
    const subscriptions = this.subscriptions.get(eventType);
    if (!subscriptions) {
      return 0;
    }

    const count = subscriptions.length;
    this.subscriptions.delete(eventType);
    this.stats.totalSubscriptions -= count;

    if (this.config.enableLogging) {
      console.log(`All subscriptions removed for event type: ${eventType} (${count} handlers)`);
    }

    return count;
  }

  /**
   * Publish event
   */
  public async publish<T = any>(event: T, eventType?: string): Promise<void> {
    let type = eventType;
    
    if (!type) {
      // Try to infer event type from event object
      if (event && typeof event === 'object') {
        if ('eventName' in event && typeof (event as any).eventName === 'string') {
          type = (event as { eventName: string }).eventName;
        } else if ('type' in event && typeof (event as any).type === 'string') {
          type = (event as { type: string }).type;
        }
      }
      
      if (!type) {
        type = 'unknown';
      }
    }

    try {
      // Update statistics
      this.stats.totalEvents++;
      this.stats.lastEventTime = new Date();
      
      const eventCount = this.stats.eventsByType.get(type) || 0;
      this.stats.eventsByType.set(type, eventCount + 1);

      if (this.config.enableLogging) {
        console.log(`Publishing event: ${type}`, event);
      }

      // Get subscriptions for this event type
      const subscriptions = this.subscriptions.get(type) || [];
      const subscriptionsToRemove: string[] = [];

      // Execute handlers
      const handlerPromises = subscriptions.map(async (subscription) => {
        try {
          await subscription.handler(event);

          // Mark one-time subscriptions for removal
          if (subscription.once) {
            subscriptionsToRemove.push(subscription.id);
          }

        } catch (error) {
          this.stats.errors++;
          this.config.errorHandler?.(error as Error, event);
        }
      });

      // Wait for all handlers to complete
      await Promise.all(handlerPromises);

      // Remove one-time subscriptions
      subscriptionsToRemove.forEach(id => this.unsubscribe(id));

    } catch (error) {
      this.stats.errors++;
      console.error('Error publishing event:', error);
      throw error;
    }
  }

  /**
   * Publish event synchronously (fire and forget)
   */
  public publishSync<T = any>(event: T, eventType?: string): void {
    this.publish(event, eventType).catch(error => {
      console.error('Error in async event publishing:', error);
    });
  }

  /**
   * Publish domain event
   */
  public async publishDomainEvent(event: DomainEvent): Promise<void> {
    await this.publish(event, event.eventName);
  }

  /**
   * Publish multiple events
   */
  public async publishBatch<T = any>(events: T[], eventType?: string): Promise<void> {
    const publishPromises = events.map(event => this.publish(event, eventType));
    await Promise.all(publishPromises);
  }

  /**
   * Get event bus statistics
   */
  public getStats(): EventBusStats {
    return {
      ...this.stats,
      eventsByType: new Map(this.stats.eventsByType)
    };
  }

  /**
   * Get active subscriptions
   */
  public getSubscriptions(): { eventType: string; count: number }[] {
    const result: { eventType: string; count: number }[] = [];
    
    for (const [eventType, subscriptions] of this.subscriptions) {
      result.push({
        eventType,
        count: subscriptions.length
      });
    }

    return result.sort((a, b) => a.eventType.localeCompare(b.eventType));
  }

  /**
   * Check if event type has subscribers
   */
  public hasSubscribers(eventType: string): boolean {
    const subscriptions = this.subscriptions.get(eventType);
    return subscriptions ? subscriptions.length > 0 : false;
  }

  /**
   * Get subscriber count for event type
   */
  public getSubscriberCount(eventType: string): number {
    const subscriptions = this.subscriptions.get(eventType);
    return subscriptions ? subscriptions.length : 0;
  }

  /**
   * Clear all subscriptions and reset statistics
   */
  public clear(): void {
    this.subscriptions.clear();
    this.stats = {
      totalEvents: 0,
      totalSubscriptions: 0,
      eventsByType: new Map(),
      errors: 0,
      lastEventTime: null
    };

    if (this.config.enableLogging) {
      console.log('Event bus cleared');
    }
  }

  /**
   * Enable/disable logging
   */
  public setLogging(enabled: boolean): void {
    this.config.enableLogging = enabled;
  }

  /**
   * Set error handler
   */
  public setErrorHandler(handler: (error: Error, event: any) => void): void {
    this.config.errorHandler = handler;
  }

  /**
   * Set maximum listeners per event type
   */
  public setMaxListeners(max: number): void {
    if (max < 1) {
      throw DomainError.operationNotPermitted('setMaxListeners', 'Max listeners must be at least 1');
    }
    this.config.maxListeners = max;
  }

  /**
   * Create event namespace for scoped subscriptions
   */
  public createNamespace(namespace: string): EventBusNamespace {
    return new EventBusNamespace(this, namespace);
  }

  /**
   * Dispose of the event bus
   */
  public dispose(): void {
    this.clear();
    console.log('Event bus disposed');
  }
}

/**
 * Event Bus Namespace
 * Provides scoped event handling within a namespace
 */
export class EventBusNamespace {
  private subscriptionIds: string[] = [];

  constructor(
    private eventBus: RealEventBus,
    private namespace: string
  ) {}

  /**
   * Subscribe to namespaced event
   */
  public subscribe<T = any>(
    eventType: string,
    handler: EventHandler<T>,
    options?: { once?: boolean; priority?: number }
  ): string {
    const namespacedEventType = `${this.namespace}.${eventType}`;
    const subscriptionId = this.eventBus.subscribe(namespacedEventType, handler, options);
    this.subscriptionIds.push(subscriptionId);
    return subscriptionId;
  }

  /**
   * Subscribe once to namespaced event
   */
  public once<T = any>(eventType: string, handler: EventHandler<T>): string {
    return this.subscribe(eventType, handler, { once: true });
  }

  /**
   * Publish namespaced event
   */
  public async publish<T = any>(event: T, eventType: string): Promise<void> {
    const namespacedEventType = `${this.namespace}.${eventType}`;
    await this.eventBus.publish(event, namespacedEventType);
  }

  /**
   * Publish namespaced event synchronously
   */
  public publishSync<T = any>(event: T, eventType: string): void {
    const namespacedEventType = `${this.namespace}.${eventType}`;
    this.eventBus.publishSync(event, namespacedEventType);
  }

  /**
   * Dispose of namespace (unsubscribe all)
   */
  public dispose(): void {
    this.subscriptionIds.forEach(id => this.eventBus.unsubscribe(id));
    this.subscriptionIds = [];
    console.log(`Event bus namespace disposed: ${this.namespace}`);
  }
} 