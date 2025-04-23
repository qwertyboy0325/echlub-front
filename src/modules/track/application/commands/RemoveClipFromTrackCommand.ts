import { TrackId } from '../../domain/value-objects/track/TrackId';
import { ClipId } from '../../domain/value-objects/clips/ClipId';

export class RemoveClipFromTrackCommand {
  constructor(
    public readonly trackId: TrackId,
    public readonly clipId: ClipId
  ) {}
} 