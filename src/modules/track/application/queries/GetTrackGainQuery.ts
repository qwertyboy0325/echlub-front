import { TrackId } from '../../domain/value-objects/track/TrackId';

export class GetTrackGainQuery {
  constructor(
    public readonly trackId: TrackId
  ) {}
} 