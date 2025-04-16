export interface IDomainEvent {
  readonly timestamp: Date;
  getEventName(): string;
} 