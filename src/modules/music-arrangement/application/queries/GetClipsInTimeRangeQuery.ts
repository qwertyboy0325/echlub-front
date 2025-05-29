import type { IQuery } from '../../../../core/mediator/IQuery';
import type { TrackId } from '../../domain/value-objects/TrackId';
import type { TimeRangeVO } from '../../domain/value-objects/TimeRangeVO';
import type { Clip } from '../../domain/entities/Clip';

export class GetClipsInTimeRangeQuery implements IQuery<Clip[]> {
  public readonly type = 'GetClipsInTimeRange';

  constructor(
    public readonly trackId: TrackId,
    public readonly timeRange: TimeRangeVO
  ) {}
} 