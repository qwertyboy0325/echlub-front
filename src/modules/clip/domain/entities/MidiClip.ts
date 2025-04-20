import { BaseClip } from './BaseClip';
import { ClipId } from '../value-objects/ClipId';
import { MidiNote } from '../value-objects/MidiNote';

export interface TimeSignature {
  numerator: number;
  denominator: number;
}

export interface MidiEvent {
  type: string;
  time: number;
  data: number[];
}

interface MidiNoteUpdate {
  pitch?: number;
  startTime?: number;
  duration?: number;
  velocity?: number;
}

export class MidiClip extends BaseClip {
  private notes: MidiNote[] = [];
  private events: MidiEvent[] = [];
  private timeSignature?: TimeSignature;
  private velocity: number = 100;

  constructor(
    id: ClipId,
    startTime: number,
    duration: number,
    notes: MidiNote[] = [],
    gain: number = 1.0
  ) {
    super(id, startTime, duration, gain);
    this.validateNotes(notes);
    this.notes = notes;
  }

  private validateNotes(notes: MidiNote[]): void {
    for (const note of notes) {
      if (note.getStartTime() < 0) throw new Error('Note start time cannot be negative');
      if (note.getDuration() <= 0) throw new Error('Note duration must be positive');
      if (note.getPitch() < 0 || note.getPitch() > 127) throw new Error('Note pitch must be between 0 and 127');
      if (note.getVelocity() < 0 || note.getVelocity() > 127) throw new Error('Note velocity must be between 0 and 127');
      if (note.getStartTime() + note.getDuration() > this.getDuration()) {
        throw new Error('Note cannot extend beyond clip duration');
      }
    }
  }

  getNotes(): MidiNote[] {
    return [...this.notes];
  }

  addNote(note: MidiNote): void {
    if (note.getStartTime() + note.getDuration() > this.getDuration()) {
      throw new Error('Note cannot extend beyond clip duration');
    }
    this.notes.push(note);
    this.incrementVersion();
  }

  removeNote(noteId: string): void {
    const index = this.notes.findIndex(n => n.getId() === noteId);
    if (index !== -1) {
      this.notes.splice(index, 1);
      this.incrementVersion();
    }
  }

  updateNote(noteId: string, update: Partial<MidiNoteUpdate>): void {
    const noteIndex = this.notes.findIndex(n => n.getId() === noteId);
    if (noteIndex === -1) {
      throw new Error('Note not found');
    }

    const existingNote = this.notes[noteIndex];
    const newNote = new MidiNote(
      update.pitch ?? existingNote.getPitch(),
      update.startTime ?? existingNote.getStartTime(),
      update.duration ?? existingNote.getDuration(),
      update.velocity ?? existingNote.getVelocity()
    );

    this.notes[noteIndex] = newNote;
    this.incrementVersion();
  }

  addEvent(event: MidiEvent): void {
    this.events.push(event);
    this.incrementVersion();
  }

  removeEvent(event: MidiEvent): void {
    this.events = this.events.filter(e => 
      e.type !== event.type || 
      e.time !== event.time || 
      e.data.some((value, index) => value !== event.data[index])
    );
    this.incrementVersion();
  }

  getEvents(): MidiEvent[] {
    return [...this.events];
  }

  setTimeSignature(timeSignature: TimeSignature): void {
    this.timeSignature = timeSignature;
    this.incrementVersion();
  }

  getTimeSignature(): TimeSignature | undefined {
    return this.timeSignature;
  }

  setVelocity(velocity: number): void {
    if (velocity < 0 || velocity > 127) {
      throw new Error('MIDI velocity must be between 0 and 127');
    }
    this.velocity = velocity;
    this.incrementVersion();
  }

  getVelocity(): number {
    return this.velocity;
  }

  clone(): MidiClip {
    const clonedClip = new MidiClip(
      ClipId.create(),
      this.getStartTime(),
      this.getDuration(),
      this.notes.map(note => new MidiNote(
        note.getPitch(),
        note.getStartTime(),
        note.getDuration(),
        note.getVelocity()
      )),
      this.getGain()
    );
    clonedClip.velocity = this.velocity;
    if (this.timeSignature) {
      clonedClip.timeSignature = { ...this.timeSignature };
    }
    clonedClip.incrementVersion();
    return clonedClip;
  }

  toJSON(): object {
    return {
      ...super.getState(),
      clipId: this.clipId.toString(),
      notes: this.notes.map(note => note.toJSON()),
      events: this.events,
      timeSignature: this.timeSignature,
      velocity: this.velocity,
      version: this.getVersion()
    };
  }
} 