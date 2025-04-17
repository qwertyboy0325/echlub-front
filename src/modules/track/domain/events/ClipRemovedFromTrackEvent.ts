import { TrackId } from '../value-objects/TrackId';
import { ClipId } from '../value-objects/ClipId';
import { IDomainEvent } from '../interfaces/IDomainEvent';

export class ClipRemovedFromTrackEvent implements IDomainEvent {
  readonly eventType = 'track:clip:removed';
  readonly timestamp: Date;
  readonly aggregateId: string;
  readonly payload: {
    clipId: string;
    clipType: 'audio' | 'midi';
  };

  constructor(
    trackId: TrackId,
    clipId: ClipId,
    clipType: 'audio' | 'midi'
  ) {
    this.timestamp = new Date();
    this.aggregateId = trackId.toString();
    this.payload = {
      clipId: clipId.toString(),
      clipType
    };
  }

  getEventName(): string {
    return 'clip:removed';
  }
} 