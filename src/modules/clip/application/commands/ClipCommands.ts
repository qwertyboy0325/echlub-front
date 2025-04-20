import { ClipId } from '../../domain/value-objects/ClipId';
import { MidiNote } from '../../domain/value-objects/MidiNote';
import { TimeSignature, MidiEvent } from '../../domain/entities/MidiClip';
import { FadeSettings } from '../../domain/entities/AudioClip';

export class CreateAudioClipCommand {
  constructor(
    public readonly sampleId: string,
    public readonly startTime: number,
    public readonly duration: number,
    public readonly offset: number = 0
  ) {}
}

export class EditAudioClipCommand {
  constructor(
    public readonly clipId: ClipId,
    public readonly changes: {
      gain?: number;
      fadeIn?: FadeSettings;
      fadeOut?: FadeSettings;
    }
  ) {}
}

export class CreateMidiClipCommand {
  constructor(
    public readonly startTime: number,
    public readonly duration: number,
    public readonly timeSignature?: TimeSignature
  ) {}
}

export class EditMidiClipCommand {
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

export class DeleteClipCommand {
  constructor(
    public readonly clipId: ClipId
  ) {}
} 