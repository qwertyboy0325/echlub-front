import { ClipId } from '../../domain/value-objects/clips/ClipId';
import { FadeSettings } from '../../domain/entities/clips/AudioClip';

export interface AudioClipChanges {
  gain?: number;
  offset?: number;
  fadeIn?: FadeSettings | null;
  fadeOut?: FadeSettings | null;
}

export class UpdateAudioClipCommand {
  constructor(
    public readonly clipId: ClipId,
    public readonly changes: AudioClipChanges
  ) {}
} 