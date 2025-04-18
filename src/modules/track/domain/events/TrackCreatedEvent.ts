import { TrackId } from '../value-objects/TrackId';
import { TrackType } from '../value-objects/TrackType';
import { IDomainEvent } from '../interfaces/IDomainEvent';

export class TrackCreatedEvent implements IDomainEvent {
  readonly eventType = 'track:created';
  readonly timestamp: Date;
  readonly aggregateId: string;
  readonly payload: {
    name: string;
    type: TrackType;
  };

  constructor(
    public readonly trackId: TrackId,
    public readonly name: string,
    public readonly type: TrackType
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