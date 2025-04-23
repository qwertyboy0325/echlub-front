import { TrackId } from '../value-objects/track/TrackId';
import { IDomainEvent } from '../interfaces/IDomainEvent';
import { BaseTrack } from '../entities/BaseTrack';

export class TrackUpdatedEvent implements IDomainEvent {
  readonly eventType = 'track:updated';
  readonly timestamp: Date;
  readonly aggregateId: string;
  readonly payload: {
    track: BaseTrack;
  };

  constructor(
    trackId: TrackId,
    track: BaseTrack
  ) {
    this.timestamp = new Date();
    this.aggregateId = trackId.toString();
    this.payload = {
      track
    };
  }
} 