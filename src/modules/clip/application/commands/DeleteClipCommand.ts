import { ClipId } from '../../domain/value-objects/ClipId';

export class DeleteClipCommand {
  constructor(
    public readonly clipId: ClipId
  ) {}
} 