import { TrackType } from '../../domain/value-objects/track/TrackType';

export class CreateTrackCommand {
  constructor(
    public readonly name: string,
    public readonly type: TrackType
  ) {}
} 