import { IDomainEvent } from '../interfaces/IDomainEvent';
import { TrackId } from '../value-objects/track/TrackId';

export class TrackNameChangedEvent implements IDomainEvent {
  public readonly eventType = 'track:name:changed';
  public readonly timestamp: Date;
  public readonly aggregateId: string;
  public readonly payload: Record<string, never>;

  constructor(
    trackId: TrackId,
    public readonly oldName: string,
    public readonly newName: string
  ) {
    this.timestamp = new Date();
    this.aggregateId = trackId.toString();
    this.payload = {};
  }

  getEventName(): string {
    return 'track:name:changed';
  }
} 