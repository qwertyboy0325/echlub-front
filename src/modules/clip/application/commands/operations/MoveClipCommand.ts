import { ClipId } from '../../../domain/value-objects/ClipId';

export class MoveClipCommand {
  constructor(
    public readonly clipId: ClipId,
    public readonly newStartTime: number,
    public readonly targetTrackId?: string
  ) {
    if (newStartTime < 0) {
      throw new Error('New start time cannot be negative');
    }
  }
} 