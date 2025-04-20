import { injectable } from 'inversify';
import type { BaseClip } from '../entities/BaseClip';
import type { AudioClip } from '../entities/AudioClip';
import type { MidiClip } from '../entities/MidiClip';

@injectable()
export class ClipValidator {
  // Validate clip duration
  validateDuration(duration: number): void {
    if (duration <= 0) {
      throw new Error('Clip duration must be positive');
    }
  }

  // Validate clip start time
  validateStartTime(startTime: number): void {
    if (startTime < 0) {
      throw new Error('Clip start time cannot be negative');
    }
  }

  // Validate audio clip specific properties
  validateAudioClip(clip: AudioClip): void {
    if (!clip.getSampleId()) {
      throw new Error('Audio clip must have a sample ID');
    }
    this.validateDuration(clip.getDuration());
    this.validateStartTime(clip.getStartTime());
  }

  // Validate MIDI clip specific properties
  validateMidiClip(clip: MidiClip): void {
    if (!clip.getNotes() || clip.getNotes().length === 0) {
      throw new Error('MIDI clip must have at least one note');
    }
    this.validateDuration(clip.getDuration());
    this.validateStartTime(clip.getStartTime());
  }

  // Generic clip validation
  validateClip(clip: BaseClip): void {
    if (!clip.getId()) {
      throw new Error('Clip must have an ID');
    }
    this.validateDuration(clip.getDuration());
    this.validateStartTime(clip.getStartTime());
  }

  // Validate clip overlap
  validateClipOverlap(clips: BaseClip[], newClip: BaseClip): void {
    for (const existingClip of clips) {
      const overlap = this.checkOverlap(
        existingClip.getStartTime(),
        existingClip.getStartTime() + existingClip.getDuration(),
        newClip.getStartTime(),
        newClip.getStartTime() + newClip.getDuration()
      );
      if (overlap) {
        throw new Error('Clips cannot overlap');
      }
    }
  }

  private checkOverlap(
    start1: number,
    end1: number,
    start2: number,
    end2: number
  ): boolean {
    return start1 < end2 && end1 > start2;
  }
} 