import { TrackId } from '../value-objects/TrackId';
import { IDomainEvent } from '../interfaces/IDomainEvent';

export class TrackRenamedEvent implements IDomainEvent {
  constructor(
    public readonly trackId: TrackId,
    public readonly newName: string,
    public readonly timestamp: Date = new Date()
  ) {}

  getEventName(): string {
    return 'track:renamed';
  }
} 