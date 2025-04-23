import { BaseClip } from './BaseClip';
import { ClipId } from '../../value-objects/clips/ClipId';

export type FadeCurveType = 'linear' | 'exponential' | 'logarithmic';

export interface FadeSettings {
  duration: number;
  curve: FadeCurveType;
}

export class AudioClip extends BaseClip {
  private fadeIn: FadeSettings | null = null;
  private fadeOut: FadeSettings | null = null;
  private sampleId: string;
  private offset: number = 0;

  constructor(
    clipId: ClipId,
    sampleId: string,
    startTime: number,
    duration: number,
    offset: number = 0
  ) {
    super(clipId, startTime, duration);
    this.sampleId = sampleId;
    this.setOffset(offset);
  }

  private validateFadeSettings(settings: FadeSettings | null): void {
    if (!settings) return;
    
    if (settings.duration <= 0) {
      throw new Error('Fade duration must be positive');
    }
    if (settings.duration > this.getDuration()) {
      throw new Error('Fade duration cannot be longer than clip duration');
    }
    if (!['linear', 'exponential', 'logarithmic'].includes(settings.curve)) {
      throw new Error('Invalid fade curve type');
    }
  }

  getSampleId(): string {
    return this.sampleId;
  }

  getOffset(): number {
    return this.offset;
  }

  setOffset(offset: number): void {
    if (offset < 0) {
      throw new Error('Offset cannot be negative');
    }
    this.offset = offset;
    this.incrementVersion();
  }

  getFadeIn(): FadeSettings | null {
    return this.fadeIn ? { ...this.fadeIn } : null;
  }

  setFadeIn(settings: FadeSettings | null): void {
    this.validateFadeSettings(settings);
    this.fadeIn = settings ? { ...settings } : null;
    this.incrementVersion();
  }

  getFadeOut(): FadeSettings | null {
    return this.fadeOut ? { ...this.fadeOut } : null;
  }

  setFadeOut(settings: FadeSettings | null): void {
    this.validateFadeSettings(settings);
    this.fadeOut = settings ? { ...settings } : null;
    this.incrementVersion();
  }

  toJSON(): object {
    return {
      ...super.getState(),
      clipId: this.clipId.toString(),
      sampleId: this.sampleId,
      offset: this.offset,
      fadeIn: this.fadeIn,
      fadeOut: this.fadeOut,
      version: this.getVersion()
    };
  }

  clone(): AudioClip {
    const clonedClip = new AudioClip(
      ClipId.create(),
      this.sampleId,
      this.getStartTime(),
      this.getDuration(),
      this.offset
    );
    clonedClip.setGain(this.getGain());
    if (this.fadeIn) {
      clonedClip.setFadeIn({ ...this.fadeIn });
    }
    if (this.fadeOut) {
      clonedClip.setFadeOut({ ...this.fadeOut });
    }
    while (clonedClip.getVersion() < this.getVersion()) {
      clonedClip.incrementVersion();
    }
    return clonedClip;
  }
} 