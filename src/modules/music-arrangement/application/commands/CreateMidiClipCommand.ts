import type { ICommand } from '../../../../core/mediator/ICommand';
import type { TrackId } from '../../domain/value-objects/TrackId';
import type { ClipId } from '../../domain/value-objects/ClipId';
import type { TimeRangeVO } from '../../domain/value-objects/TimeRangeVO';
import type { InstrumentRef } from '../../domain/value-objects/InstrumentRef';
import type { ClipMetadata } from '../../domain/value-objects/ClipMetadata';

export class CreateMidiClipCommand implements ICommand<ClipId> {
  public readonly type = 'CreateMidiClip';

  constructor(
    public readonly trackId: TrackId,
    public readonly range: TimeRangeVO,
    public readonly instrument: InstrumentRef,
    public readonly metadata: ClipMetadata
  ) {}
} 