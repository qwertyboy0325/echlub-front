import { TrackId } from '../../domain/value-objects/track/TrackId';

export class GetTrackClipsQuery {
  constructor(
    public readonly trackId: TrackId,
    public readonly startTime?: number,
    public readonly endTime?: number
  ) {}
}