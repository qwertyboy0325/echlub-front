import { DomainEvent } from '../../../../core/events/DomainEvent';

/**
 * Event Store Interface
 * Handles persistence and retrieval of domain events for event sourcing
 */
export interface EventStore {
  /**
   * Save events for an aggregate
   */
  saveEvents(
    aggregateId: string,
    events: DomainEvent[],
    expectedVersion: number
  ): Promise<void>;

  /**
   * Get all events for an aggregate
   */
  getEventsForAggregate(
    aggregateId: string,
    fromVersion?: number
  ): Promise<DomainEvent[]>;

  /**
   * Get events for an aggregate up to a specific version
   */
  getEventsForAggregateToVersion(
    aggregateId: string,
    toVersion: number
  ): Promise<DomainEvent[]>;

  /**
   * Save a snapshot of an aggregate
   */
  saveSnapshot(
    aggregateId: string,
    snapshot: AggregateSnapshot,
    version: number
  ): Promise<void>;

  /**
   * Get the latest snapshot for an aggregate
   */
  getSnapshot(aggregateId: string): Promise<AggregateSnapshot | null>;

  /**
   * Get all events after a specific timestamp
   */
  getEventsSince(timestamp: Date): Promise<DomainEvent[]>;

  /**
   * Get events by event type
   */
  getEventsByType(eventType: string): Promise<DomainEvent[]>;
}

/**
 * Aggregate Snapshot for performance optimization
 */
export interface AggregateSnapshot {
  aggregateId: string;
  aggregateType: string;
  version: number;
  data: any;
  timestamp: Date;
}

/**
 * Stored Event with metadata
 */
export interface StoredEvent {
  id: string;
  aggregateId: string;
  eventType: string;
  eventData: string; // JSON serialized event
  version: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * In-Memory Event Store Implementation
 * For development and testing purposes
 */
export class InMemoryEventStore implements EventStore {
  private events: Map<string, StoredEvent[]> = new Map();
  private snapshots: Map<string, AggregateSnapshot> = new Map();
  private eventIdCounter = 0;

  async saveEvents(
    aggregateId: string,
    events: DomainEvent[],
    expectedVersion: number
  ): Promise<void> {
    const existingEvents = this.events.get(aggregateId) || [];
    const currentVersion = existingEvents.length;

    // Optimistic concurrency check
    if (currentVersion !== expectedVersion) {
      throw new Error(
        `Concurrency conflict: expected version ${expectedVersion}, but current version is ${currentVersion}`
      );
    }

    const storedEvents: StoredEvent[] = events.map((event, index) => ({
      id: (++this.eventIdCounter).toString(),
      aggregateId,
      eventType: event.eventName,
      eventData: JSON.stringify(event),
      version: currentVersion + index + 1,
      timestamp: new Date(),
      metadata: {
        eventName: event.eventName,
        occurredOn: event.occurredOn.toISOString()
      }
    }));

    this.events.set(aggregateId, [...existingEvents, ...storedEvents]);
  }

  async getEventsForAggregate(
    aggregateId: string,
    fromVersion?: number
  ): Promise<DomainEvent[]> {
    const storedEvents = this.events.get(aggregateId) || [];
    
    const filteredEvents = fromVersion 
      ? storedEvents.filter(e => e.version > fromVersion)
      : storedEvents;

    return filteredEvents.map(this.deserializeEvent);
  }

  async getEventsForAggregateToVersion(
    aggregateId: string,
    toVersion: number
  ): Promise<DomainEvent[]> {
    const storedEvents = this.events.get(aggregateId) || [];
    const filteredEvents = storedEvents.filter(e => e.version <= toVersion);
    return filteredEvents.map(this.deserializeEvent);
  }

  async saveSnapshot(
    aggregateId: string,
    snapshot: AggregateSnapshot,
    version: number
  ): Promise<void> {
    this.snapshots.set(aggregateId, {
      ...snapshot,
      version,
      timestamp: new Date()
    });
  }

  async getSnapshot(aggregateId: string): Promise<AggregateSnapshot | null> {
    return this.snapshots.get(aggregateId) || null;
  }

  async getEventsSince(timestamp: Date): Promise<DomainEvent[]> {
    const allEvents: StoredEvent[] = [];
    
    for (const events of this.events.values()) {
      allEvents.push(...events.filter(e => e.timestamp >= timestamp));
    }

    return allEvents
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .map(this.deserializeEvent);
  }

  async getEventsByType(eventType: string): Promise<DomainEvent[]> {
    const allEvents: StoredEvent[] = [];
    
    for (const events of this.events.values()) {
      allEvents.push(...events.filter(e => e.eventType === eventType));
    }

    return allEvents.map(this.deserializeEvent);
  }

  private deserializeEvent(storedEvent: StoredEvent): DomainEvent {
    try {
      const eventData = JSON.parse(storedEvent.eventData);
      return eventData as DomainEvent;
    } catch (error) {
      throw new Error(`Failed to deserialize event ${storedEvent.id}: ${error}`);
    }
  }

  // Utility methods for testing and debugging
  public clear(): void {
    this.events.clear();
    this.snapshots.clear();
    this.eventIdCounter = 0;
  }

  public getAllEvents(): StoredEvent[] {
    const allEvents: StoredEvent[] = [];
    for (const events of this.events.values()) {
      allEvents.push(...events);
    }
    return allEvents.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  public getEventCount(aggregateId?: string): number {
    if (aggregateId) {
      return this.events.get(aggregateId)?.length || 0;
    }
    
    let total = 0;
    for (const events of this.events.values()) {
      total += events.length;
    }
    return total;
  }
} 