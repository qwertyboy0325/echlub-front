import { TrackId } from '../../domain/value-objects/track/TrackId';

export class RemoveInputTrackFromBusCommand {
  constructor(
    public readonly busTrackId: TrackId,
    public readonly inputTrackId: TrackId
  ) {}
} 