import { TrackId } from '../../domain/value-objects/track/TrackId';

export class GetTrackRoutingQuery {
  constructor(
    public readonly trackId: TrackId
  ) {}
} 