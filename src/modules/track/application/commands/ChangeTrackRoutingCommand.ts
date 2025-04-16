import { TrackId } from '../../domain/value-objects/TrackId';
import { TrackRouting } from '../../domain/value-objects/TrackRouting';

export class ChangeTrackRoutingCommand {
  constructor(
    public readonly trackId: TrackId,
    public readonly routing: TrackRouting
  ) {}
} 