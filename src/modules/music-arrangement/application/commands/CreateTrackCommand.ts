import type { ICommand } from '../../../../core/mediator/ICommand';
import type { TrackType } from '../../domain/value-objects/TrackType';
import type { TrackMetadata } from '../../domain/value-objects/TrackMetadata';
import type { TrackId } from '../../domain/value-objects/TrackId';

export class CreateTrackCommand implements ICommand<string> {
  public readonly type = 'CreateTrack';

  constructor(
    public readonly ownerId: string, // PeerId as string
    public readonly trackType: TrackType,
    public readonly name: string,
    public readonly userId: string
  ) {}
} 