import { TrackId } from '../../domain/value-objects/TrackId';
import { TrackRouting } from '../../domain/value-objects/TrackRouting';

export class SetTrackRoutingCommand {
  constructor(
    public readonly trackId: TrackId,
    public readonly routing: TrackRouting
  ) {}
} 