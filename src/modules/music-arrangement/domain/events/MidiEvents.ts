import { DomainEvent } from '../../../../core/events/DomainEvent';
import { TrackId } from '../value-objects/TrackId';
import { ClipId } from '../value-objects/ClipId';
import { MidiNoteId } from '../value-objects/MidiNoteId';
import { QuantizeValue } from '../value-objects/QuantizeValue';
import { MidiNote } from '../entities/MidiNote';

/**
 * Base interface for undoable events
 */
export interface UndoableEvent extends DomainEvent {
  createUndoEvent(): DomainEvent;
}

/**
 * MIDI Note Added Event
 * Raised when a MIDI note is added to a clip
 */
export class MidiNoteAddedEvent extends DomainEvent implements UndoableEvent {
  constructor(
    public readonly trackId: TrackId,
    public readonly clipId: ClipId,
    public readonly note: MidiNote,
    public readonly insertIndex?: number // For precise undo positioning
  ) {
    super('MidiNoteAdded', trackId.toString());
  }

  // Create inverse event for undo
  public createUndoEvent(): MidiNoteRemovedEvent {
    return new MidiNoteRemovedEvent(this.trackId, this.clipId, this.note.noteId, this.note);
  }
}

/**
 * MIDI Note Removed Event
 * Raised when a MIDI note is removed from a clip
 */
export class MidiNoteRemovedEvent extends DomainEvent implements UndoableEvent {
  constructor(
    public readonly trackId: TrackId,
    public readonly clipId: ClipId,
    public readonly noteId: MidiNoteId,
    public readonly removedNote: MidiNote // Store removed note for undo
  ) {
    super('MidiNoteRemoved', trackId.toString());
  }

  public createUndoEvent(): MidiNoteAddedEvent {
    return new MidiNoteAddedEvent(this.trackId, this.clipId, this.removedNote);
  }
}

/**
 * MIDI Note Updated Event
 * Raised when a MIDI note is updated
 */
export class MidiNoteUpdatedEvent extends DomainEvent implements UndoableEvent {
  constructor(
    public readonly trackId: TrackId,
    public readonly clipId: ClipId,
    public readonly noteId: MidiNoteId,
    public readonly oldNote: MidiNote, // Store old state for undo
    public readonly newNote: MidiNote
  ) {
    super('MidiNoteUpdated', trackId.toString());
  }

  public createUndoEvent(): MidiNoteUpdatedEvent {
    return new MidiNoteUpdatedEvent(this.trackId, this.clipId, this.noteId, this.newNote, this.oldNote);
  }
}

/**
 * MIDI Clip Quantized Event
 * Raised when a MIDI clip is quantized
 */
export class MidiClipQuantizedEvent extends DomainEvent implements UndoableEvent {
  constructor(
    public readonly trackId: TrackId,
    public readonly clipId: ClipId,
    public readonly quantizeValue: QuantizeValue,
    public readonly originalNotes: MidiNote[] // Store original state for undo
  ) {
    super('MidiClipQuantized', trackId.toString());
  }

  public createUndoEvent(): MidiClipNotesReplacedEvent {
    return new MidiClipNotesReplacedEvent(this.trackId, this.clipId, this.originalNotes);
  }
}

/**
 * MIDI Clip Transposed Event
 * Raised when a MIDI clip is transposed
 */
export class MidiClipTransposedEvent extends DomainEvent implements UndoableEvent {
  constructor(
    public readonly trackId: TrackId,
    public readonly clipId: ClipId,
    public readonly semitones: number,
    public readonly originalNotes: MidiNote[]
  ) {
    super('MidiClipTransposed', trackId.toString());
  }

  public createUndoEvent(): MidiClipNotesReplacedEvent {
    return new MidiClipNotesReplacedEvent(this.trackId, this.clipId, this.originalNotes);
  }
}

/**
 * MIDI Clip Notes Replaced Event
 * Utility event for restoring complete note state (used by undo operations)
 */
export class MidiClipNotesReplacedEvent extends DomainEvent {
  constructor(
    public readonly trackId: TrackId,
    public readonly clipId: ClipId,
    public readonly notes: MidiNote[]
  ) {
    super('MidiClipNotesReplaced', trackId.toString());
  }
} 