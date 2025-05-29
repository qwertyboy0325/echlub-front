import { Clip } from './Clip';
import { ClipId } from '../value-objects/ClipId';
import { TimeRangeVO } from '../value-objects/TimeRangeVO';
import { ClipMetadata } from '../value-objects/ClipMetadata';
import { ClipType } from '../value-objects/ClipType';
import { InstrumentRef } from '../value-objects/InstrumentRef';
import { MidiNote } from './MidiNote';
import { MidiNoteId } from '../value-objects/MidiNoteId';
import type { QuantizeValue } from '../value-objects/QuantizeValue';

/**
 * MIDI Clip Entity
 * Represents a MIDI clip with note collection and instrument reference
 */
export class MidiClip extends Clip {
  private _notes: Map<string, MidiNote>; // Use Map for efficient note management
  private _instrument: InstrumentRef;
  private _velocity?: number;

  constructor(
    clipId: ClipId,
    range: TimeRangeVO,
    instrument: InstrumentRef,
    metadata: ClipMetadata,
    velocity?: number,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    super(clipId, range, metadata, createdAt, updatedAt);
    this._notes = new Map();
    this._instrument = instrument;
    this._velocity = velocity;
  }

  public static create(
    range: TimeRangeVO,
    instrument: InstrumentRef,
    metadata: ClipMetadata
  ): MidiClip {
    const clipId = ClipId.create();
    return new MidiClip(clipId, range, instrument, metadata);
  }

  // MIDI note operations
  public addNote(note: MidiNote): void {
    // Validate note is within clip range
    if (!this._range.contains(note.range)) {
      throw new Error('MIDI note must be within clip range');
    }

    // Check for overlapping notes with same pitch
    const overlappingNote = this.findOverlappingNote(note);
    if (overlappingNote) {
      throw new Error('MIDI notes with same pitch cannot overlap');
    }

    const noteId = note.id.toString();
    this._notes.set(noteId, note);
    this.updateTimestamp();
  }

  public removeNote(noteId: MidiNoteId): void {
    const noteIdStr = noteId.toString();
    const note = this._notes.get(noteIdStr);
    
    if (!note) {
      throw new Error('MIDI note not found in clip');
    }

    this._notes.delete(noteIdStr);
    this.updateTimestamp();
  }

  public updateNote(noteId: MidiNoteId, updatedNote: MidiNote): void {
    const noteIdStr = noteId.toString();
    const existingNote = this._notes.get(noteIdStr);
    
    if (!existingNote) {
      throw new Error('MIDI note not found in clip');
    }

    // Validate updated note is within clip range
    if (!this._range.contains(updatedNote.range)) {
      throw new Error('Updated MIDI note must be within clip range');
    }

    this._notes.set(noteIdStr, updatedNote);
    this.updateTimestamp();
  }

  public quantizeNotes(quantizeValue: QuantizeValue, bpm: number = 120): void {
    const quantizedNotes = new Map<string, MidiNote>();

    for (const [noteId, note] of this._notes) {
      const quantizedNote = note.quantize(quantizeValue, bpm);
      quantizedNotes.set(noteId, quantizedNote);
    }

    this._notes = quantizedNotes;
    this.updateTimestamp();
  }

  public transposeNotes(semitones: number): void {
    const transposedNotes = new Map<string, MidiNote>();

    for (const [noteId, note] of this._notes) {
      const transposedNote = note.transpose(semitones);
      transposedNotes.set(noteId, transposedNote);
    }

    this._notes = transposedNotes;
    this.updateTimestamp();
  }

  public setInstrument(instrument: InstrumentRef): void {
    this._instrument = instrument;
    this.updateTimestamp();
  }

  public setDefaultVelocity(velocity: number): void {
    if (velocity < 0 || velocity > 127) {
      throw new Error('MIDI velocity must be between 0 and 127');
    }
    this._velocity = velocity;
    this.updateTimestamp();
  }

  // Implemented abstract methods
  public getType(): ClipType {
    return ClipType.MIDI;
  }

  public getDuration(): number {
    return this._range.length;
  }

  public clone(): MidiClip {
    const newClipId = ClipId.create();
    const clonedClip = new MidiClip(
      newClipId,
      this._range,
      this._instrument,
      this._metadata,
      this._velocity
    );

    // Clone all notes
    for (const [noteId, note] of this._notes) {
      const clonedNote = note.clone();
      clonedClip._notes.set(clonedNote.id.toString(), clonedNote);
    }

    return clonedClip;
  }

  // Helper methods
  private findOverlappingNote(newNote: MidiNote): MidiNote | null {
    for (const note of this._notes.values()) {
      if (note.pitch === newNote.pitch && note.range.intersects(newNote.range)) {
        return note;
      }
    }
    return null;
  }

  // Query methods
  public getNote(noteId: MidiNoteId): MidiNote | undefined {
    return this._notes.get(noteId.toString());
  }

  public getNotesInRange(range: TimeRangeVO): MidiNote[] {
    return Array.from(this._notes.values()).filter(note => 
      note.range.intersects(range)
    );
  }

  public getNotesAtTime(timePoint: number): MidiNote[] {
    return Array.from(this._notes.values()).filter(note => 
      note.contains(timePoint)
    );
  }

  public getNotesByPitch(pitch: number): MidiNote[] {
    return Array.from(this._notes.values()).filter(note => 
      note.pitch === pitch
    );
  }

  public hasNotes(): boolean {
    return this._notes.size > 0;
  }

  public isEmpty(): boolean {
    return this._notes.size === 0;
  }

  // Getters
  public get notes(): MidiNote[] { 
    return Array.from(this._notes.values()); 
  }

  public get instrument(): InstrumentRef { 
    return this._instrument; 
  }

  public get velocity(): number | undefined { 
    return this._velocity; 
  }

  public get noteCount(): number { 
    return this._notes.size; 
  }

  public get instrumentId(): string {
    return this._instrument.instrumentId;
  }

  public get instrumentName(): string {
    return this._instrument.name;
  }

  public get lowestPitch(): number | undefined {
    if (this._notes.size === 0) return undefined;
    return Math.min(...Array.from(this._notes.values()).map(note => note.pitch));
  }

  public get highestPitch(): number | undefined {
    if (this._notes.size === 0) return undefined;
    return Math.max(...Array.from(this._notes.values()).map(note => note.pitch));
  }
} 