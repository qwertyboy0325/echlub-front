import { TrackId } from '../../domain/value-objects/TrackId';

export class GetTrackQuery {
  constructor(
    public readonly trackId: TrackId
  ) {}
} 
