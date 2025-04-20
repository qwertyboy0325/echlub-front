import { ClipId } from '../../../domain/value-objects/ClipId';

export class CopyClipCommand {
  constructor(
    public readonly sourceClipId: ClipId,
    public readonly targetStartTime: number,
    public readonly targetTrackId?: string
  ) {
    if (targetStartTime < 0) {
      throw new Error('Target start time cannot be negative');
    }
  }
} 