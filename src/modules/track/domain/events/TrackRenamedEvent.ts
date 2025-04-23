import { TrackId } from '../value-objects/track/TrackId';
import { IDomainEvent } from '../interfaces/IDomainEvent';

export class TrackRenamedEvent implements IDomainEvent {
  readonly eventType = 'track:renamed';
  readonly timestamp: Date;
  readonly aggregateId: string;
  readonly payload: {
    newName: string;
  };

  constructor(
    trackId: TrackId,
    newName: string
  ) {
    this.timestamp = new Date();
    this.aggregateId = trackId.toString();
    this.payload = {
      newName
    };
  }
} 