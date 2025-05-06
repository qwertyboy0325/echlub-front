/**
 * 領域事件基類
 * 所有領域事件都應繼承此類
 */
export abstract class DomainEvent {
  public readonly occurredOn: Date;
  public readonly eventName: string;
  public readonly aggregateId?: string;
 
  constructor(eventName: string, aggregateId?: string) {
    this.occurredOn = new Date();
    this.eventName = eventName;
    this.aggregateId = aggregateId;
  }
} 