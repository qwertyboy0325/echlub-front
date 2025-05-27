import type { ICommand } from '../../../../core/mediator/ICommand';
import type { TrackId } from '../../domain/value-objects/TrackId';
import type { ClipId } from '../../domain/value-objects/ClipId';

export class RemoveClipCommand implements ICommand<void> {
  public readonly type = 'RemoveClip';

  constructor(
    public readonly trackId: TrackId,
    public readonly clipId: ClipId
  ) {}
} 