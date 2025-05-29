import type { IQuery } from '../../../../core/mediator/IQuery';
import type { TrackId } from '../../domain/value-objects/TrackId';
import type { Track } from '../../domain/aggregates/Track';

export class GetTrackByIdQuery implements IQuery<Track | null> {
  public readonly type = 'GetTrackById';

  constructor(
    public readonly trackId: TrackId
  ) {}
} 