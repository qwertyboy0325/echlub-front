import { ClipId } from '../value-objects/clips/ClipId';
import { MidiNote } from '../value-objects/note/MidiNote';
import { IDomainEvent } from '../interfaces/IDomainEvent';

export class NoteUpdatedInClipEvent implements IDomainEvent {
  readonly eventType = 'clip:note:updated';
  readonly timestamp: Date;
  readonly aggregateId: string;
  readonly payload: {
    noteIndex: number;
    note: object;
  };

  constructor(
    clipId: ClipId,
    noteIndex: number,
    note: MidiNote
  ) {
    this.timestamp = new Date();
    this.aggregateId = clipId.toString();
    this.payload = {
      noteIndex,
      note: note.toJSON()
    };
  }

  getEventName(): string {
    return 'note:updated';
  }
} 