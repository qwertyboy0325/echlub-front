import { v4 as uuidv4 } from 'uuid';
import { ClipId } from './ClipId';

export class MidiClipId extends ClipId {
  private constructor(value: string) {
    super(value);
  }

  static create(): MidiClipId {
    return new MidiClipId(uuidv4());
  }

  static fromString(value: string): MidiClipId {
    return new MidiClipId(value);
  }
} 