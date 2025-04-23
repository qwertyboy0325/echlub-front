import { IDomainEvent } from '../interfaces/IDomainEvent';
import { TrackId } from '../value-objects/track/TrackId';

export class TrackMuteChangedEvent implements IDomainEvent {
  public readonly eventType = 'track:mute:changed';
  public readonly timestamp: Date;
  public readonly aggregateId: string;
  public readonly payload: Record<string, never>;

  constructor(
    trackId: TrackId,
    public readonly oldMuted: boolean,
    public readonly newMuted: boolean
  ) {
    this.timestamp = new Date();
    this.aggregateId = trackId.toString();
    this.payload = {};
  }

  getEventName(): string {
    return 'track:mute:changed';
  }
} 