import { TrackId } from '../value-objects/TrackId';
import { ClipId } from '../value-objects/ClipId';
import { IDomainEvent } from '../interfaces/IDomainEvent';

export class ClipAddedToTrackEvent implements IDomainEvent {
  constructor(
    public readonly trackId: TrackId,
    public readonly clipId: ClipId,
    public readonly type: 'audio' | 'midi',
    public readonly timestamp: Date = new Date()
  ) {}

  getEventName(): string {
    return 'clip:added';
  }
} 