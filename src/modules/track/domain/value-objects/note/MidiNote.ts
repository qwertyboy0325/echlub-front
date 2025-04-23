import { IValueObject } from '../../interfaces/IValueObject';

export interface MidiNoteProps {
  noteNumber: number;
  velocity: number;
  startTime: number;
  duration: number;
}

export class MidiNote implements IValueObject {
  private readonly _noteNumber: number;
  private readonly _velocity: number;
  private readonly _startTime: number;
  private readonly _duration: number;

  private constructor(props: MidiNoteProps) {
    this.validateProps(props);
    this._noteNumber = props.noteNumber;
    this._velocity = props.velocity;
    this._startTime = props.startTime;
    this._duration = props.duration;
  }

  static create(props: MidiNoteProps): MidiNote {
    return new MidiNote(props);
  }

  private validateProps(props: MidiNoteProps): void {
    if (props.noteNumber < 0 || props.noteNumber > 127) {
      throw new Error('Note number must be between 0 and 127');
    }
    if (props.velocity < 0 || props.velocity > 127) {
      throw new Error('Velocity must be between 0 and 127');
    }
    if (props.startTime < 0) {
      throw new Error('Note start time cannot be negative');
    }
    if (props.duration <= 0) {
      throw new Error('Note duration must be positive');
    }
  }

  get noteNumber(): number {
    return this._noteNumber;
  }

  get velocity(): number {
    return this._velocity;
  }

  get startTime(): number {
    return this._startTime;
  }

  get duration(): number {
    return this._duration;
  }

  equals(other: IValueObject): boolean {
    if (!(other instanceof MidiNote)) {
      return false;
    }
    return (
      this._noteNumber === other._noteNumber &&
      this._velocity === other._velocity &&
      this._startTime === other._startTime &&
      this._duration === other._duration
    );
  }

  toString(): string {
    return `MidiNote(note=${this._noteNumber}, vel=${this._velocity}, start=${this._startTime}, dur=${this._duration})`;
  }

  toJSON(): object {
    return {
      noteNumber: this._noteNumber,
      velocity: this._velocity,
      startTime: this._startTime,
      duration: this._duration
    };
  }

  // 創建一個新的 MidiNote，但改變某些屬性
  with(props: Partial<MidiNoteProps>): MidiNote {
    return MidiNote.create({
      noteNumber: props.noteNumber ?? this._noteNumber,
      velocity: props.velocity ?? this._velocity,
      startTime: props.startTime ?? this._startTime,
      duration: props.duration ?? this._duration
    });
  }

  // 檢查兩個音符是否在時間上重疊
  overlaps(other: MidiNote): boolean {
    const thisEnd = this._startTime + this._duration;
    const otherEnd = other._startTime + other._duration;
    return this._startTime < otherEnd && other._startTime < thisEnd;
  }

  // 檢查音符是否在指定的時間範圍內（完全或部分）
  isInTimeRange(start: number, end: number): boolean {
    const noteEnd = this._startTime + this._duration;
    return this._startTime < end && noteEnd > start;
  }
} 