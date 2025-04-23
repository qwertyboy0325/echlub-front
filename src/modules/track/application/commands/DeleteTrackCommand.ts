import { TrackId } from '../../domain/value-objects/track/TrackId';

export class DeleteTrackCommand {
  constructor(
    public readonly trackId: TrackId
  ) {}
} 