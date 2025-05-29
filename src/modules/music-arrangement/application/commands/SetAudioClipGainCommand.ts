import type { ICommand } from '../../../../core/mediator/ICommand';
import type { TrackId } from '../../domain/value-objects/TrackId';
import type { ClipId } from '../../domain/value-objects/ClipId';

export class SetAudioClipGainCommand implements ICommand<void> {
  public readonly type = 'SetAudioClipGain';

  constructor(
    public readonly trackId: TrackId,
    public readonly clipId: ClipId,
    public readonly gain: number,
    public readonly userId: string
  ) {}
} 