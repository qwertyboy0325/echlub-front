import { UniqueId } from '../../../../core/value-objects/UniqueId';

/**
 * MIDI Note unique identifier
 * Extends core UniqueId for consistent ID management
 */
export class MidiNoteId extends UniqueId<string> {
  private constructor(value: string) {
    super(value);
  }

  public static create(): MidiNoteId {
    return new MidiNoteId(crypto.randomUUID());
  }

  public static fromString(value: string): MidiNoteId {
    return new MidiNoteId(value);
  }

  protected validateProps(props: { value: string }): { value: string } {
    if (!props.value || props.value.trim() === '') {
      throw new Error('MidiNoteId cannot be empty');
    }
    return props;
  }
} 