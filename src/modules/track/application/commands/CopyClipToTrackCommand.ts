import { TrackId } from '../../domain/value-objects/track/TrackId';
import { ClipId } from '../../domain/value-objects/clips/ClipId';

export class CopyClipToTrackCommand {
  constructor(
    public readonly sourceClipId: ClipId,
    public readonly targetTrackId: TrackId,
    public readonly startTime: number
  ) {}
} 