import { TrackId } from '../value-objects/track/TrackId';
import { ClipId } from '../value-objects/clips/ClipId';
import { IDomainEvent } from '../interfaces/IDomainEvent';

interface CreatedClipInfo {
  clipId: ClipId;
  type: 'audio' | 'midi';
}

export class ClipsCreatedEvent implements IDomainEvent {
  readonly eventType = 'track:clips:created';
  readonly timestamp: Date;
  readonly aggregateId: string;
  readonly payload: {
    clips: {
      id: string;
      type: 'audio' | 'midi';
    }[];
  };

  constructor(
    trackId: TrackId,
    clips: CreatedClipInfo[]
  ) {
    this.timestamp = new Date();
    this.aggregateId = trackId.toString();
    this.payload = {
      clips: clips.map(clip => ({
        id: clip.clipId.toString(),
        type: clip.type
      }))
    };
  }

  getEventName(): string {
    return 'clips:created';
  }
} 