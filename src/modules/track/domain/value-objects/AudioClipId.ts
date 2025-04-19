import { v4 as uuidv4 } from 'uuid';
import { ClipId } from './ClipId';

export class AudioClipId extends ClipId {
  private constructor(value: string) {
    super(value);
  }

  static create(): AudioClipId {
    return new AudioClipId(uuidv4());
  }

  static fromString(value: string): AudioClipId {
    return new AudioClipId(value);
  }

  equals(other: AudioClipId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
} 