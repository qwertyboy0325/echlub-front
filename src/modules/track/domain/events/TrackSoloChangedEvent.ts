import { IDomainEvent } from '../interfaces/IDomainEvent';
import { TrackId } from '../value-objects/track/TrackId';

export class TrackSoloChangedEvent implements IDomainEvent {
  public readonly eventType = 'track:solo:changed';
  public readonly timestamp: Date;
  public readonly aggregateId: string;
  public readonly payload: Record<string, never>;

  constructor(
    trackId: TrackId,
    public readonly oldSolo: boolean,
    public readonly newSolo: boolean
  ) {
    this.timestamp = new Date();
    this.aggregateId = trackId.toString();
    this.payload = {};
  }

  getEventName(): string {
    return 'track:solo:changed';
  }
} 