import { ClipId } from '../../domain/value-objects/clips/ClipId';

export class RemoveNoteFromClipCommand {
  constructor(
    public readonly clipId: ClipId,
    public readonly noteIndex: number
  ) {}
} 