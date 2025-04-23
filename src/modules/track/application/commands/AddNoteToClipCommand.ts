import { ClipId } from '../../domain/value-objects/clips/ClipId';
import { MidiNoteProps } from '../../domain/value-objects/note/MidiNote';

export class AddNoteToClipCommand {
  constructor(
    public readonly clipId: ClipId,
    public readonly noteProps: MidiNoteProps
  ) {}
} 