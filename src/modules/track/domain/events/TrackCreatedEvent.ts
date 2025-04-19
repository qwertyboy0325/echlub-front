import { IDomainEvent } from '../interfaces/IDomainEvent';
import { TrackId } from '../value-objects/TrackId';
import { TrackType } from '../value-objects/TrackType';

export class TrackCreatedEvent implements IDomainEvent {
  readonly eventType = 'track:created';
  readonly aggregateId: string;
  readonly timestamp: Date;
  readonly payload: {
    trackId: TrackId;
    name: string;
    type: TrackType;
  };

  constructor(
    public readonly trackId: TrackId,
    public readonly name: string,
    public readonly type: TrackType
  ) {
    this.aggregateId = trackId.toString();
    this.timestamp = new Date();
    this.payload = {
      trackId,
      name,
      type
    };
  }
} 