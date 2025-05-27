import type { ICommand } from '../../../../core/mediator/ICommand';
import type { TrackId } from '../../domain/value-objects/TrackId';
import type { ClipId } from '../../domain/value-objects/ClipId';

export class TransposeMidiClipCommand implements ICommand<void> {
  public readonly type = 'TransposeMidiClip';

  constructor(
    public readonly trackId: TrackId,
    public readonly clipId: ClipId,
    public readonly semitones: number
  ) {}
} 