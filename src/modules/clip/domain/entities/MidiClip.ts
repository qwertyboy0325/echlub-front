import { BaseClip } from './BaseClip';
import { ClipId } from '../value-objects/ClipId';

export class MidiNote {
  constructor(
    public readonly id: string,
    public readonly pitch: number,
    public readonly velocity: number,
    public readonly startTime: number,
    public readonly duration: number
  ) {
    if (pitch < 0 || pitch > 127) throw new Error('Note pitch must be between 0 and 127');
    if (velocity < 0 || velocity > 127) throw new Error('Note velocity must be between 0 and 127');
    if (startTime < 0) throw new Error('Note start time cannot be negative');
    if (duration <= 0) throw new Error('Note duration must be positive');
  }

  toJSON(): object {
    return {
      id: this.id,
      pitch: this.pitch,
      velocity: this.velocity,
      startTime: this.startTime,
      duration: this.duration
    };
  }
}

export interface TimeSignature {
  numerator: number;
  denominator: number;
}

export interface MidiEvent {
  type: string;
  time: number;
  data: number[];
}

export class MidiClip extends BaseClip {
  private notes: MidiNote[] = [];
  private events: MidiEvent[] = [];
  private timeSignature: TimeSignature = { numerator: 4, denominator: 4 };
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
      if (note.startTime < 0) throw new Error('Note start time cannot be negative');
      if (note.duration <= 0) throw new Error('Note duration must be positive');
      if (note.pitch < 0 || note.pitch > 127) throw new Error('Note pitch must be between 0 and 127');
      if (note.velocity < 0 || note.velocity > 127) throw new Error('Note velocity must be between 0 and 127');
      if (note.startTime + note.duration > this.getDuration()) {
        throw new Error('Note cannot extend beyond clip duration');
      }
    }
  }

  getNotes(): MidiNote[] {
    return [...this.notes];
  }

  addNote(note: MidiNote): void {
    this.validateNotes([note]);
    this.notes.push(note);
    this.incrementVersion();
  }

  removeNote(noteId: string): void {
    const index = this.notes.findIndex(n => n.id === noteId);
    if (index !== -1) {
      this.notes.splice(index, 1);
      this.incrementVersion();
    }
  }

  updateNote(noteId: string, updates: Partial<MidiNote>): void {
    const note = this.notes.find(n => n.id === noteId);
    if (!note) return;

    const updatedNote = { ...note, ...updates };
    this.validateNotes([updatedNote as MidiNote]);
    
    Object.assign(note, updates);
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

  getTimeSignature(): TimeSignature {
    return { ...this.timeSignature };
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
    return new MidiClip(
      ClipId.create(),
      this.getStartTime(),
      this.getDuration(),
      this.notes.map(note => new MidiNote(
        crypto.randomUUID(),
        note.pitch,
        note.velocity,
        note.startTime,
        note.duration
      )),
      this.getGain()
    );
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