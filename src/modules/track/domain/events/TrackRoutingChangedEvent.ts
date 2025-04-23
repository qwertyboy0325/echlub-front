import { IDomainEvent } from '../interfaces/IDomainEvent';
import { TrackId } from '../value-objects/track/TrackId';
import { TrackRouting } from '../value-objects/track/TrackRouting';

export class TrackRoutingChangedEvent implements IDomainEvent {
  public readonly eventType = 'track:routing:changed';
  public readonly timestamp: Date;
  public readonly aggregateId: string;
  public readonly payload: Record<string, never>;

  constructor(
    trackId: TrackId,
    public readonly oldRouting: TrackRouting,
    public readonly newRouting: TrackRouting
  ) {
    this.timestamp = new Date();
    this.aggregateId = trackId.toString();
    this.payload = {};
  }

  getEventName(): string {
    return 'track:routing:changed';
  }
} 