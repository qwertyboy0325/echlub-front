import { TrackId } from '../value-objects/track/TrackId';
import { IDomainEvent } from '../interfaces/IDomainEvent';

export class TrackDeletedEvent implements IDomainEvent {
  readonly eventType = 'track:deleted';
  readonly timestamp: Date;
  readonly aggregateId: string;
  readonly payload: Record<string, never>;

  constructor(trackId: TrackId) {
    this.timestamp = new Date();
    this.aggregateId = trackId.toString();
    this.payload = {};
  }
} 