import { TrackId } from '../value-objects/TrackId';
import { TrackRouting } from '../value-objects/TrackRouting';
import { IDomainEvent } from '../interfaces/IDomainEvent';

export class TrackRoutingChangedEvent implements IDomainEvent {
  constructor(
    public readonly trackId: TrackId,
    public readonly routing: TrackRouting,
    public readonly timestamp: Date = new Date()
  ) {}

  getEventName(): string {
    return 'track:routing:changed';
  }
} 