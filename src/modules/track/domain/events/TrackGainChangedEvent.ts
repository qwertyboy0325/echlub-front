import { IDomainEvent } from '../interfaces/IDomainEvent';
import { TrackId } from '../value-objects/track/TrackId';

export class TrackGainChangedEvent implements IDomainEvent {
  public readonly eventType = 'track:gain:changed';
  public readonly timestamp: Date;
  public readonly aggregateId: string;
  public readonly payload: Record<string, never>;

  constructor(
    trackId: TrackId,
    public readonly oldGain: number,
    public readonly newGain: number
  ) {
    this.timestamp = new Date();
    this.aggregateId = trackId.toString();
    this.payload = {};
  }

  getEventName(): string {
    return 'track:gain:changed';
  }
} 