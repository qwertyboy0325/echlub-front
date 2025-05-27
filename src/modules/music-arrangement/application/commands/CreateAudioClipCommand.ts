import type { ICommand } from '../../../../core/mediator/ICommand';
import type { TrackId } from '../../domain/value-objects/TrackId';
import type { ClipId } from '../../domain/value-objects/ClipId';
import type { TimeRangeVO } from '../../domain/value-objects/TimeRangeVO';
import type { AudioSourceRef } from '../../domain/value-objects/AudioSourceRef';
import type { ClipMetadata } from '../../domain/value-objects/ClipMetadata';

export class CreateAudioClipCommand implements ICommand<ClipId> {
  public readonly type = 'CreateAudioClip';

  constructor(
    public readonly trackId: TrackId,
    public readonly range: TimeRangeVO,
    public readonly audioSource: AudioSourceRef,
    public readonly metadata: ClipMetadata
  ) {}
} 