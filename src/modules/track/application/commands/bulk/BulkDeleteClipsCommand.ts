import { ClipId } from '../../../domain/value-objects/clips/ClipId';

export class BulkDeleteClipsCommand {
  constructor(
    public readonly clipIds: ClipId[]
  ) {}
} 