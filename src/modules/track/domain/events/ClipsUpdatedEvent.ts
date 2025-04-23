import { ClipId } from '../value-objects/clips/ClipId';
import { IDomainEvent } from '../interfaces/IDomainEvent';

interface UpdatedClipInfo {
  clipId: ClipId;
  type: 'audio' | 'midi';
}

export class ClipsUpdatedEvent implements IDomainEvent {
  readonly eventType = 'track:clips:updated';
  readonly timestamp: Date;
  readonly aggregateId: string;
  readonly payload: {
    clips: {
      id: string;
      type: 'audio' | 'midi';
    }[];
  };

  constructor(clips: UpdatedClipInfo[]) {
    this.timestamp = new Date();
    // 使用第一個片段的 ID 作為聚合根 ID
    this.aggregateId = clips[0].clipId.toString();
    this.payload = {
      clips: clips.map(clip => ({
        id: clip.clipId.toString(),
        type: clip.type
      }))
    };
  }

  getEventName(): string {
    return 'clips:updated';
  }
} 