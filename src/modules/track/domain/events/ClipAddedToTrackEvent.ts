import { IDomainEvent } from '../interfaces/IDomainEvent';
import { TrackId } from '../value-objects/track/TrackId';
import { ClipId } from '../value-objects/clips/ClipId';

export class ClipAddedToTrackEvent implements IDomainEvent {
  readonly eventType = 'track:clip:added';
  readonly timestamp = new Date();
  readonly aggregateId: string;
  readonly payload: {
    trackId: string;
    clipId: string;
  };

  constructor(
    trackId: TrackId,
    clipId: ClipId
  ) {
    this.aggregateId = trackId.toString();
    this.payload = {
      trackId: trackId.toString(),
      clipId: clipId.toString()
    };
  }

  getEventName(): string {
    return 'clip:added';
  }
} 