import { TrackId } from '../../domain/value-objects/track/TrackId';

export class GetTrackNameQuery {
  constructor(
    public readonly trackId: TrackId
  ) {}
} 