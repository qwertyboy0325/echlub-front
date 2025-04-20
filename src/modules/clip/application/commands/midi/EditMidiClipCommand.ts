import { ClipId } from '../../../domain/value-objects/ClipId';
import { MidiNote } from '../../../domain/value-objects/MidiNote';
import { TimeSignature, MidiEvent } from '../../../domain/entities/MidiClip';

export interface MidiClipChanges {
  notes?: MidiNote[];
  events?: MidiEvent[];
  timeSignature?: TimeSignature;
  velocity?: number;
}

export class EditMidiClipCommand {
  constructor(
    public readonly clipId: ClipId,
    public readonly changes: MidiClipChanges
  ) {
    if (changes.velocity !== undefined) {
      if (changes.velocity < 0 || changes.velocity > 127) {
        throw new Error('MIDI velocity must be between 0 and 127');
      }
    }

    if (changes.timeSignature) {
      if (changes.timeSignature.numerator <= 0) {
        throw new Error('Time signature numerator must be positive');
      }
      if (changes.timeSignature.denominator <= 0) {
        throw new Error('Time signature denominator must be positive');
      }
      if (![1, 2, 4, 8, 16, 32].includes(changes.timeSignature.denominator)) {
        throw new Error('Invalid time signature denominator');
      }
    }

    // 驗證所有音符
    if (changes.notes) {
      changes.notes.forEach((note, index) => {
        if (!(note instanceof MidiNote)) {
          throw new Error(`Invalid MIDI note at index ${index}`);
        }
      });
    }

    // 驗證所有事件
    if (changes.events) {
      changes.events.forEach((event, index) => {
        if (event.time < 0) {
          throw new Error(`Event time cannot be negative at index ${index}`);
        }
        if (!Array.isArray(event.data)) {
          throw new Error(`Event data must be an array at index ${index}`);
        }
      });
    }
  }
} 