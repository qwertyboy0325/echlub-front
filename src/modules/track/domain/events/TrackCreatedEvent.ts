import { TrackId } from '../value-objects/TrackId';
import { IDomainEvent } from '../interfaces/IDomainEvent';

export class TrackCreatedEvent implements IDomainEvent {
  constructor(
    public readonly trackId: TrackId,
    public readonly name: string,
    public readonly type: 'audio' | 'instrument' | 'bus',
    public readonly timestamp: Date = new Date()
  ) {}

  getEventName(): string {
    return 'track:created';
  }
} 