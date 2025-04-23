import { IDomainEvent } from '../interfaces/IDomainEvent';
import { ClipId } from '../value-objects/clips/ClipId';
import { AudioClip } from '../entities/clips/AudioClip';
import { MidiClip } from '../entities/clips/MidiClip';

export class ClipCreatedEvent implements IDomainEvent {
  readonly eventType = 'track:clip:created';
  readonly timestamp = new Date();
  readonly aggregateId: string;
  readonly payload: {
    clipId: string;
    type: 'audio' | 'midi';
    startTime: number;
    duration: number;
  };

  constructor(
    clipId: ClipId,
    clip: AudioClip | MidiClip,
    type: 'audio' | 'midi'
  ) {
    this.aggregateId = clipId.toString();
    this.payload = {
      clipId: clipId.toString(),
      type,
      startTime: clip.getStartTime(),
      duration: clip.getDuration()
    };
  }

  getEventName(): string {
    return 'clip:created';
  }
} 