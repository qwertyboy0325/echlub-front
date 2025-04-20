import { BaseClip } from './BaseClip';
import { ClipId } from '../value-objects/ClipId';
import { WaveformData } from '../value-objects/WaveformData';

export interface FadeSettings {
  type: 'linear' | 'exponential';
  duration: number;
}

export class AudioClip extends BaseClip {
  private readonly sampleId: string;
  private offset: number;
  private waveformData?: WaveformData;
  private fadeIn?: FadeSettings;
  private fadeOut?: FadeSettings;

  constructor(
    clipId: ClipId,
    sampleId: string,
    startTime: number,
    duration: number,
    offset: number = 0
  ) {
    super(clipId, startTime, duration);
    this.sampleId = sampleId;
    this.offset = offset;
  }

  getSampleId(): string {
    return this.sampleId;
  }

  getOffset(): number {
    return this.offset;
  }

  getWaveform(): WaveformData | undefined {
    return this.waveformData;
  }

  updateWaveform(waveform: WaveformData): void {
    this.waveformData = waveform;
    this.incrementVersion();
  }

  setFadeIn(settings: FadeSettings): void {
    this.fadeIn = settings;
    this.incrementVersion();
  }

  setFadeOut(settings: FadeSettings): void {
    this.fadeOut = settings;
    this.incrementVersion();
  }

  getFadeIn(): FadeSettings | undefined {
    return this.fadeIn;
  }

  getFadeOut(): FadeSettings | undefined {
    return this.fadeOut;
  }

  toJSON(): object {
    return {
      ...super.getState(),
      clipId: this.clipId.toString(),
      sampleId: this.sampleId,
      offset: this.offset,
      waveform: this.waveformData?.toJSON(),
      fadeIn: this.fadeIn,
      fadeOut: this.fadeOut,
      version: this.getVersion()
    };
  }

  clone(): AudioClip {
    return new AudioClip(
      ClipId.create(),
      this.sampleId,
      this.getStartTime(),
      this.getDuration(),
      this.offset
    );
  }
} 