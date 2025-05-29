import { DomainEvent } from '../../../../core/events/DomainEvent';
import { TrackId } from '../value-objects/TrackId';
import { ClipId } from '../value-objects/ClipId';
import { ClipMetadata } from '../value-objects/ClipMetadata';
import { TimeRangeVO } from '../value-objects/TimeRangeVO';
import { AudioSourceRef } from '../value-objects/AudioSourceRef';
import { InstrumentRef } from '../value-objects/InstrumentRef';

/**
 * Audio Clip Created Event
 * Raised when an audio clip is created
 */
export class AudioClipCreatedEvent extends DomainEvent {
  constructor(
    public readonly clipId: ClipId,
    public readonly range: TimeRangeVO,
    public readonly audioSource: AudioSourceRef
  ) {
    super('AudioClipCreated', clipId.toString());
  }
}

/**
 * MIDI Clip Created Event
 * Raised when a MIDI clip is created
 */
export class MidiClipCreatedEvent extends DomainEvent {
  constructor(
    public readonly clipId: ClipId,
    public readonly range: TimeRangeVO,
    public readonly instrument: InstrumentRef
  ) {
    super('MidiClipCreated', clipId.toString());
  }
}

/**
 * Clip Moved Event
 * Raised when a clip's range is changed
 */
export class ClipMovedEvent extends DomainEvent {
  constructor(
    public readonly clipId: ClipId,
    public readonly newRange: TimeRangeVO
  ) {
    super('ClipMoved', clipId.toString());
  }
}

/**
 * Clip Metadata Updated Event
 * Raised when clip metadata is updated
 */
export class ClipMetadataUpdatedEvent extends DomainEvent {
  constructor(
    public readonly clipId: ClipId,
    public readonly metadata: ClipMetadata
  ) {
    super('ClipMetadataUpdated', clipId.toString());
  }
}

/**
 * Audio Clip Gain Changed Event
 * Raised when audio clip gain is changed
 */
export class AudioClipGainChangedEvent extends DomainEvent {
  constructor(
    public readonly trackId: TrackId,
    public readonly clipId: ClipId,
    public readonly gain: number
  ) {
    super('AudioClipGainChanged', clipId.toString());
  }
}

/**
 * Audio Clip Fade Changed Event
 * Raised when audio clip fade in/out is changed
 */
export class AudioClipFadeChangedEvent extends DomainEvent {
  constructor(
    public readonly clipId: ClipId,
    public readonly fadeType: 'fadeIn' | 'fadeOut',
    public readonly fadeTime: number
  ) {
    super('AudioClipFadeChanged', clipId.toString());
  }
} 