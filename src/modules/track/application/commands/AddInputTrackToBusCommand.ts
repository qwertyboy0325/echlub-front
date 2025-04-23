import { TrackId } from '../../domain/value-objects/track/TrackId';

export class AddInputTrackToBusCommand {
  constructor(
    public readonly busTrackId: TrackId,
    public readonly inputTrackId: TrackId
  ) {}
} 