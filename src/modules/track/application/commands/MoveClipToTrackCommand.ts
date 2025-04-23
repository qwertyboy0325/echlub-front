import { TrackId } from '../../domain/value-objects/track/TrackId';
import { ClipId } from '../../domain/value-objects/clips/ClipId';

export class MoveClipToTrackCommand {
  constructor(
    public readonly clipId: ClipId,
    public readonly sourceTrackId: TrackId,
    public readonly targetTrackId: TrackId,
    public readonly startTime: number
  ) {}
} 