import { TrackId } from '../../domain/value-objects/track/TrackId';

export class RenameTrackCommand {
  constructor(
    public readonly trackId: TrackId,
    public readonly newName: string
  ) {}
} 