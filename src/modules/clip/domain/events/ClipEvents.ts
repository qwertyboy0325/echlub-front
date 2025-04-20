import { ClipId } from '../value-objects/ClipId';
import { MidiNote } from '../value-objects/MidiNote';
import { TimeSignature, MidiEvent } from '../entities/MidiClip';
import { FadeSettings } from '../entities/AudioClip';

export class AudioClipCreatedEvent {
  constructor(
    public readonly clipId: ClipId,
    public readonly sampleId: string,
    public readonly startTime: number,
    public readonly duration: number
  ) {}
}

export class AudioClipEditedEvent {
  constructor(
    public readonly clipId: ClipId,
    public readonly changes: {
      gain?: number;
      fadeIn?: FadeSettings;
      fadeOut?: FadeSettings;
    }
  ) {}
}

export class MidiClipCreatedEvent {
  constructor(
    public readonly clipId: ClipId,
    public readonly startTime: number,
    public readonly duration: number,
    public readonly timeSignature?: TimeSignature
  ) {}
}

export class MidiClipEditedEvent {
  constructor(
    public readonly clipId: ClipId,
    public readonly changes: {
      notes?: MidiNote[];
      events?: MidiEvent[];
      timeSignature?: TimeSignature;
      velocity?: number;
    }
  ) {}
}

export class ClipDeletedEvent {
  constructor(
    public readonly clipId: ClipId
  ) {}
} 