import { ClipId } from '../../../domain/value-objects/ClipId';
import { FadeSettings } from '../../../domain/entities/AudioClip';

export interface AudioClipChanges {
  gain?: number;
  fadeIn?: FadeSettings;
  fadeOut?: FadeSettings;
}

export class EditAudioClipCommand {
  constructor(
    public readonly clipId: ClipId,
    public readonly changes: AudioClipChanges
  ) {
    if (changes.gain !== undefined && changes.gain < 0) {
      throw new Error('Gain cannot be negative');
    }
    if (changes.fadeIn?.duration !== undefined && changes.fadeIn.duration < 0) {
      throw new Error('Fade in duration cannot be negative');
    }
    if (changes.fadeOut?.duration !== undefined && changes.fadeOut.duration < 0) {
      throw new Error('Fade out duration cannot be negative');
    }
  }
} 