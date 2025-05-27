import type { ICommand } from '../../../../core/mediator/ICommand';
import type { TrackId } from '../../domain/value-objects/TrackId';
import type { ClipId } from '../../domain/value-objects/ClipId';
import type { QuantizeValue } from '../../domain/value-objects/QuantizeValue';

export class QuantizeMidiClipCommand implements ICommand<void> {
  public readonly type = 'QuantizeMidiClip';

  constructor(
    public readonly trackId: TrackId,
    public readonly clipId: ClipId,
    public readonly quantizeValue: QuantizeValue
  ) {}
} 