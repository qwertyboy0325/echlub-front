import type { ICommand } from '../../../../core/mediator/ICommand';
import type { TrackId } from '../../domain/value-objects/TrackId';
import type { ClipId } from '../../domain/value-objects/ClipId';
import type { TimeRangeVO } from '../../domain/value-objects/TimeRangeVO';

export class MoveClipCommand implements ICommand<void> {
  public readonly type = 'MoveClip';

  constructor(
    public readonly trackId: TrackId,
    public readonly clipId: ClipId,
    public readonly newRange: TimeRangeVO,
    public readonly userId: string
  ) {}
} 