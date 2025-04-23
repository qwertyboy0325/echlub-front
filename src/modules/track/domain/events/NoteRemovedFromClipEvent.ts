import { ClipId } from '../value-objects/clips/ClipId';
import { IDomainEvent } from '../interfaces/IDomainEvent';

export class NoteRemovedFromClipEvent implements IDomainEvent {
  readonly eventType = 'clip:note:removed';
  readonly timestamp: Date;
  readonly aggregateId: string;
  readonly payload: {
    noteIndex: number;
  };

  constructor(
    clipId: ClipId,
    noteIndex: number
  ) {
    this.timestamp = new Date();
    this.aggregateId = clipId.toString();
    this.payload = {
      noteIndex
    };
  }

  getEventName(): string {
    return 'note:removed';
  }
} 