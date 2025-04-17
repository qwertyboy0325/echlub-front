import { TrackId } from '../value-objects/TrackId';
import { TrackRouting } from '../value-objects/TrackRouting';
import { IDomainEvent } from '../interfaces/IDomainEvent';

export class TrackRoutingChangedEvent implements IDomainEvent {
  readonly eventType = 'track:routing:changed';
  readonly timestamp: Date;
  readonly aggregateId: string;
  readonly payload: {
    routing: TrackRouting;
  };

  constructor(
    trackId: TrackId,
    routing: TrackRouting
  ) {
    this.timestamp = new Date();
    this.aggregateId = trackId.toString();
    this.payload = {
      routing
    };
  }
} 