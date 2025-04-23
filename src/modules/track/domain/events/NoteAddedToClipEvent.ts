import { ClipId } from '../value-objects/clips/ClipId';
import { MidiNote } from '../value-objects/note/MidiNote';
import { IDomainEvent } from '../interfaces/IDomainEvent';

export class NoteAddedToClipEvent implements IDomainEvent {
  readonly eventType = 'clip:note:added';
  readonly timestamp: Date;
  readonly aggregateId: string;
  readonly payload: {
    note: object;
  };

  constructor(
    clipId: ClipId,
    note: MidiNote
  ) {
    this.timestamp = new Date();
    this.aggregateId = clipId.toString();
    this.payload = {
      note: note.toJSON()
    };
  }

  getEventName(): string {
    return 'note:added';
  }
} 