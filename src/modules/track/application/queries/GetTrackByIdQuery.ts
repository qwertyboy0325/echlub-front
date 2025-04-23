import { TrackId } from '../../domain/value-objects/track/TrackId';

export class GetTrackByIdQuery {
  constructor(
    public readonly trackId: TrackId
  ) {}
} 