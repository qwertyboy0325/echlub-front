import { ClipId } from '../value-objects/clips/ClipId';
import { IDomainEvent } from '../interfaces/IDomainEvent';

export class ClipsDeletedEvent implements IDomainEvent {
  readonly eventType = 'track:clips:deleted';
  readonly timestamp: Date;
  readonly aggregateId: string;
  readonly payload: {
    clipIds: string[];
  };

  constructor(clipIds: ClipId[]) {
    this.timestamp = new Date();
    // 使用第一個片段的 ID 作為聚合根 ID
    this.aggregateId = clipIds[0].toString();
    this.payload = {
      clipIds: clipIds.map(id => id.toString())
    };
  }

  getEventName(): string {
    return 'clips:deleted';
  }
} 