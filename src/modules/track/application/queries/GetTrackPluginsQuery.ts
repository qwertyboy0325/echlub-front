import { TrackId } from '../../domain/value-objects/track/TrackId';

export class GetTrackPluginsQuery {
  constructor(
    public readonly trackId: TrackId
  ) {}
} 