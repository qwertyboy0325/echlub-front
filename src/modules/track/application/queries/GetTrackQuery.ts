import { TrackId } from '../../domain/value-objects/track/TrackId';

export class GetTrackQuery {
  constructor(
    public readonly trackId: TrackId
  ) {}
} 