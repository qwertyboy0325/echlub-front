import { TrackId } from '../value-objects/TrackId';
import { IDomainEvent } from '../interfaces/IDomainEvent';

export class TrackCreatedEvent implements IDomainEvent {
  readonly eventType = 'track:created';
  readonly timestamp: Date;
  readonly aggregateId: string;
  readonly payload: {
    name: string;
    type: 'audio' | 'instrument' | 'bus';
  };

  constructor(
    trackId: TrackId,
    name: string,
    type: 'audio' | 'instrument' | 'bus'
  ) {
    this.timestamp = new Date();
    this.aggregateId = trackId.toString();
    this.payload = {
      name,
      type
    };
  }

  getEventName(): string {
    return 'track:created';
  }
} 