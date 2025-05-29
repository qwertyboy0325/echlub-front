import { Clip } from './Clip';
import { ClipId } from '../value-objects/ClipId';
import { TimeRangeVO } from '../value-objects/TimeRangeVO';
import { ClipMetadata } from '../value-objects/ClipMetadata';
import { ClipType } from '../value-objects/ClipType';
import { AudioSourceRef } from '../value-objects/AudioSourceRef';

/**
 * Audio Clip Entity
 * Represents an audio clip with gain and fade controls
 */
export class AudioClip extends Clip {
  private _audioSource: AudioSourceRef;
  private _gain: number;
  private _fadeIn?: number;
  private _fadeOut?: number;

  constructor(
    clipId: ClipId,
    range: TimeRangeVO,
    audioSource: AudioSourceRef,
    metadata: ClipMetadata,
    gain: number = 1.0,
    fadeIn?: number,
    fadeOut?: number,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    super(clipId, range, metadata, createdAt, updatedAt);
    this._audioSource = audioSource;
    this._gain = gain;
    this._fadeIn = fadeIn;
    this._fadeOut = fadeOut;
  }

  public static create(
    range: TimeRangeVO,
    audioSource: AudioSourceRef,
    metadata: ClipMetadata
  ): AudioClip {
    const clipId = ClipId.create();
    return new AudioClip(clipId, range, audioSource, metadata);
  }

  // Audio-specific operations
  public setGain(gain: number): void {
    if (gain < 0) {
      throw new Error('Gain cannot be negative');
    }
    this._gain = gain;
    this.updateTimestamp();
  }

  public setFadeIn(fadeIn: number): void {
    if (fadeIn < 0) {
      throw new Error('Fade in cannot be negative');
    }
    this._fadeIn = fadeIn;
    this.updateTimestamp();
  }

  public setFadeOut(fadeOut: number): void {
    if (fadeOut < 0) {
      throw new Error('Fade out cannot be negative');
    }
    this._fadeOut = fadeOut;
    this.updateTimestamp();
  }

  public setAudioSource(audioSource: AudioSourceRef): void {
    this._audioSource = audioSource;
    this.updateTimestamp();
  }

  // Implemented abstract methods
  public getType(): ClipType {
    return ClipType.AUDIO;
  }

  public getDuration(): number {
    return this._range.length;
  }

  public clone(): AudioClip {
    const newClipId = ClipId.create();
    return new AudioClip(
      newClipId,
      this._range,
      this._audioSource,
      this._metadata,
      this._gain,
      this._fadeIn,
      this._fadeOut
    );
  }

  // Business methods
  public isSourceSynced(): boolean {
    return this._audioSource.isSynced();
  }

  public hasValidSource(): boolean {
    return !this._audioSource.hasError();
  }

  public getEffectiveGain(timePoint: number): number {
    let effectiveGain = this._gain;

    // Apply fade in
    if (this._fadeIn && timePoint < this.startTime + this._fadeIn) {
      const fadeProgress = (timePoint - this.startTime) / this._fadeIn;
      effectiveGain *= Math.max(0, Math.min(1, fadeProgress));
    }

    // Apply fade out
    if (this._fadeOut && timePoint > this.endTime - this._fadeOut) {
      const fadeProgress = (this.endTime - timePoint) / this._fadeOut;
      effectiveGain *= Math.max(0, Math.min(1, fadeProgress));
    }

    return effectiveGain;
  }

  // Getters
  public get audioSource(): AudioSourceRef { 
    return this._audioSource; 
  }

  public get gain(): number { 
    return this._gain; 
  }

  public get fadeIn(): number | undefined { 
    return this._fadeIn; 
  }

  public get fadeOut(): number | undefined { 
    return this._fadeOut; 
  }

  public get sourceId(): string {
    return this._audioSource.sourceId;
  }

  public get sourceUrl(): string | undefined {
    return this._audioSource.url;
  }

  public get sourceDuration(): number | undefined {
    return this._audioSource.duration;
  }

  // WebRTC buffer specific methods
  public get sourceBuffer(): ArrayBuffer | undefined {
    return this._audioSource.buffer;
  }

  public get collaboratorId(): string | undefined {
    return this._audioSource.collaboratorId;
  }

  public get sessionId(): string | undefined {
    return this._audioSource.sessionId;
  }

  public isWebRTCBuffer(): boolean {
    return this._audioSource.isWebRTCBuffer();
  }

  public isReadyForPlayback(): boolean {
    if (this.isWebRTCBuffer()) {
      // WebRTC buffers are immediately ready since they contain the actual audio data
      return this._audioSource.buffer !== undefined;
    } else {
      // Regular audio sources need to be synced
      return this._audioSource.isSynced();
    }
  }
} 