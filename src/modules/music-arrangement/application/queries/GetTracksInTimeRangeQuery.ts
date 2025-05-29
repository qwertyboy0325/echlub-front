import type { IQuery } from '../../../../core/mediator/IQuery';
import type { TimeRangeVO } from '../../domain/value-objects/TimeRangeVO';
import type { Track } from '../../domain/aggregates/Track';

export class GetTracksInTimeRangeQuery implements IQuery<Track[]> {
  public readonly type = 'GetTracksInTimeRange';

  constructor(
    public readonly ownerId: string, // PeerId as string
    public readonly timeRange: TimeRangeVO
  ) {}
} 