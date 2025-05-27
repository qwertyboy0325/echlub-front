import { Entity } from '../../../../core/entities/Entity';
import { MidiNoteId } from '../value-objects/MidiNoteId';
import { TimeRangeVO } from '../value-objects/TimeRangeVO';
import type { QuantizeValue } from '../value-objects/QuantizeValue';

/**
 * MIDI Note Entity
 * Represents an individual MIDI note with pitch, velocity, and timing
 */
export class MidiNote extends Entity<MidiNoteId> {
  private _pitch: number;
  private _velocity: number;
  private _range: TimeRangeVO;

  constructor(
    noteId: MidiNoteId,
    pitch: number,
    velocity: number,
    range: TimeRangeVO,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    super(noteId, createdAt, updatedAt);
    this.validatePitch(pitch);
    this.validateVelocity(velocity);
    this._pitch = pitch;
    this._velocity = velocity;
    this._range = range;
  }

  public static create(
    pitch: number,
    velocity: number,
    range: TimeRangeVO
  ): MidiNote {
    const noteId = MidiNoteId.create();
    return new MidiNote(noteId, pitch, velocity, range);
  }

  // Business methods
  public setPitch(pitch: number): void {
    this.validatePitch(pitch);
    this._pitch = pitch;
    this.updateTimestamp();
  }

  public setVelocity(velocity: number): void {
    this.validateVelocity(velocity);
    this._velocity = velocity;
    this.updateTimestamp();
  }

  public setRange(range: TimeRangeVO): void {
    this._range = range;
    this.updateTimestamp();
  }

  public transpose(semitones: number): MidiNote {
    const newPitch = Math.max(0, Math.min(127, this._pitch + semitones));
    return new MidiNote(MidiNoteId.create(), newPitch, this._velocity, this._range);
  }

  public quantize(quantizeValue: QuantizeValue, bpm: number = 120): MidiNote {
    const quantizedRange = this._range.quantize(quantizeValue, bpm);
    return new MidiNote(MidiNoteId.create(), this._pitch, this._velocity, quantizedRange);
  }

  public clone(): MidiNote {
    return new MidiNote(MidiNoteId.create(), this._pitch, this._velocity, this._range);
  }

  // Validation methods
  private validatePitch(pitch: number): void {
    if (pitch < 0 || pitch > 127) {
      throw new Error('MIDI pitch must be between 0 and 127');
    }
  }

  private validateVelocity(velocity: number): void {
    if (velocity < 0 || velocity > 127) {
      throw new Error('MIDI velocity must be between 0 and 127');
    }
  }

  // Getters
  public get pitch(): number { 
    return this._pitch; 
  }

  public get velocity(): number { 
    return this._velocity; 
  }

  public get range(): TimeRangeVO { 
    return this._range; 
  }

  public get noteId(): MidiNoteId { 
    return this.id; 
  }
  
  public get noteName(): string {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(this._pitch / 12) - 1;
    const note = noteNames[this._pitch % 12];
    return `${note}${octave}`;
  }

  public get duration(): number {
    return this._range.length;
  }

  public get startTime(): number {
    return this._range.start;
  }

  public get endTime(): number {
    return this._range.end;
  }

  // Business methods
  public contains(timePoint: number): boolean {
    return timePoint >= this.startTime && timePoint < this.endTime;
  }
} 