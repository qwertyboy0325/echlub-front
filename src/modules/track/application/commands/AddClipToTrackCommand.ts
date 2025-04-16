import { TrackId } from '../../domain/value-objects/TrackId';
import { ClipId } from '../../domain/value-objects/ClipId';

export class AddClipToTrackCommand {
  constructor(
    public readonly trackId: TrackId,
    public readonly clipId: ClipId
  ) {}
} 