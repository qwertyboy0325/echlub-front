import { TrackId } from '../../domain/value-objects/track/TrackId';
import { TrackRouting } from '../../domain/value-objects/track/TrackRouting';

export class SetTrackRoutingCommand {
  constructor(
    public readonly trackId: TrackId,
    public readonly routing: TrackRouting
  ) {}
} 