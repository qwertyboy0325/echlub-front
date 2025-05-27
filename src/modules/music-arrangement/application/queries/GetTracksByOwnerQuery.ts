import type { IQuery } from '../../../../core/mediator/IQuery';
import type { Track } from '../../domain/aggregates/Track';

export class GetTracksByOwnerQuery implements IQuery<Track[]> {
  public readonly type = 'GetTracksByOwner';

  constructor(
    public readonly ownerId: string // PeerId as string
  ) {}
} 