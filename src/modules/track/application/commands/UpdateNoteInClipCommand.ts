import { ClipId } from '../../domain/value-objects/clips/ClipId';
import { MidiNoteProps } from '../../domain/value-objects/note/MidiNote';

export class UpdateNoteInClipCommand {
  constructor(
    public readonly clipId: ClipId,
    public readonly noteIndex: number,
    public readonly noteProps: MidiNoteProps
  ) {}
} 