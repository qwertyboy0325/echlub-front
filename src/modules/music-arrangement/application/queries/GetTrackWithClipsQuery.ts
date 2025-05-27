import type { IQuery } from '../../../../core/mediator/IQuery';
import type { TrackId } from '../../domain/value-objects/TrackId';
import type { Track } from '../../domain/aggregates/Track';

export class GetTrackWithClipsQuery implements IQuery<Track | null> {
  public readonly type = 'GetTrackWithClips';

  constructor(
    public readonly trackId: TrackId
  ) {}
} 