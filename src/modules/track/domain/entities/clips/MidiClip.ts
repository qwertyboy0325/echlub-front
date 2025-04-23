import { BaseClip, ClipState } from './BaseClip';
import { ClipId } from '../../value-objects/clips/ClipId';
import { MidiNote } from '../../value-objects/note/MidiNote';

export interface TimeSignature {
  numerator: number;
  denominator: number;
}

export class MidiClip extends BaseClip {
  private notes: MidiNote[] = [];
  private readonly _timeSignature: TimeSignature;

  constructor(
    clipId: ClipId,
    startTime: number,
    duration: number,
    notes: MidiNote[] = [],
    timeSignature: TimeSignature,
    initialState?: Partial<ClipState>
  ) {
    super(clipId, startTime, duration, initialState);
    this.validateTimeSignature(timeSignature);
    this.notes = [...notes];
    this._timeSignature = timeSignature;
  }

  private validateTimeSignature(timeSignature: TimeSignature): void {
    if (timeSignature.numerator <= 0) {
      throw new Error('Time signature numerator must be positive');
    }
    if (!this.isPowerOfTwo(timeSignature.denominator)) {
      throw new Error('Time signature denominator must be a power of 2');
    }
  }

  private isPowerOfTwo(n: number): boolean {
    return n > 0 && (n & (n - 1)) === 0;
  }

  getNotes(): MidiNote[] {
    return [...this.notes];
  }

  addNote(note: MidiNote): void {
    // 檢查音符是否在片段的時間範圍內（相對於片段開始時間）
    if (!note.isInTimeRange(0, this.getDuration())) {
      throw new Error('Note must be within clip time range');
    }

    // 檢查是否與其他音符重疊
    if (this.hasOverlappingNote(note)) {
      throw new Error('Note overlaps with existing note');
    }

    this.notes.push(note);
    this.incrementVersion();
  }

  private hasOverlappingNote(note: MidiNote): boolean {
    return this.notes.some(existingNote => existingNote.overlaps(note));
  }

  removeNote(noteIndex: number): void {
    if (noteIndex < 0 || noteIndex >= this.notes.length) {
      throw new Error('Invalid note index');
    }
    this.notes.splice(noteIndex, 1);
    this.incrementVersion();
  }

  updateNote(noteIndex: number, note: MidiNote): void {
    if (noteIndex < 0 || noteIndex >= this.notes.length) {
      throw new Error('Invalid note index');
    }

    // 檢查音符是否在片段的時間範圍內
    if (!note.isInTimeRange(0, this.getDuration())) {
      throw new Error('Note must be within clip time range');
    }

    // 檢查是否與其他音符重疊（排除當前要更新的音符）
    const otherNotes = this.notes.filter((_, index) => index !== noteIndex);
    if (otherNotes.some(existingNote => existingNote.overlaps(note))) {
      throw new Error('Note overlaps with existing note');
    }

    this.notes[noteIndex] = note;
    this.incrementVersion();
  }

  // 在指定時間範圍內查找音符
  findNotesInRange(start: number, end: number): MidiNote[] {
    return this.notes.filter(note => note.isInTimeRange(start, end));
  }

  // 按音高排序音符
  sortNotesByPitch(): void {
    this.notes.sort((a, b) => a.noteNumber - b.noteNumber);
    this.incrementVersion();
  }

  // 縮放音符的時間
  scaleTime(factor: number): void {
    if (factor <= 0) {
      throw new Error('Time scale factor must be positive');
    }
    this.setDuration(this.getDuration() * factor);
    this.notes = this.notes.map(note => note.with({
      startTime: note.startTime * factor,
      duration: note.duration * factor
    }));
    this.incrementVersion();
  }

  toJSON(): object {
    return {
      clipId: this.clipId.toString(),
      startTime: this.getStartTime(),
      duration: this.getDuration(),
      gain: this.getGain(),
      notes: this.notes.map(note => note.toJSON()),
      version: this.getVersion(),
      timeSignature: this.timeSignature
    };
  }

  clone(): MidiClip {
    const clonedClip = new MidiClip(
      ClipId.create(),
      this.getStartTime(),
      this.getDuration(),
      this.notes.map(note => note.with({})),
      { ...this._timeSignature },
      { gain: this.getGain() }
    );
    return clonedClip;
  }

  get timeSignature(): TimeSignature {
    return { ...this._timeSignature };
  }
} 