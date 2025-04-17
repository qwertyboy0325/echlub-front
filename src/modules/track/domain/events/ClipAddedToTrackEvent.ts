import { TrackId } from '../value-objects/TrackId';
import { ClipId } from '../value-objects/ClipId';
import { IDomainEvent } from '../interfaces/IDomainEvent';

export class ClipAddedToTrackEvent implements IDomainEvent {
  readonly eventType = 'track:clip:added';
  readonly timestamp: Date;
  readonly aggregateId: string;
  readonly payload: {
    clipId: string;
    type: 'audio' | 'midi';
  };

  constructor(
    trackId: TrackId,
    clipId: ClipId,
    type: 'audio' | 'midi'
  ) {
    this.timestamp = new Date();
    this.aggregateId = trackId.toString();
    this.payload = {
      clipId: clipId.toString(),
      type
    };
  }

  getEventName(): string {
    return 'clip:added';
  }
} 