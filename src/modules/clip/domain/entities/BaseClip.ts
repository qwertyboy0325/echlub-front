import { ClipId } from '../value-objects/ClipId';
import { IAggregate } from '../interfaces/IAggregate';

export interface ClipState {
  startTime: number;
  duration: number;
  gain: number;
}

export abstract class BaseClip implements IAggregate {
  private _version: number = 0;
  protected gain: number = 1;

  constructor(
    protected readonly clipId: ClipId,
    protected startTime: number,
    protected duration: number,
    protected version: number = 1
  ) {
    if (startTime < 0) throw new Error('Start time cannot be negative');
    if (duration <= 0) throw new Error('Duration must be positive');
    if (this.gain < 0) throw new Error('Gain cannot be negative');
  }

  getId(): string {
    return this.clipId.toString();
  }

  getVersion(): number {
    return this._version;
  }

  incrementVersion(): void {
    this._version++;
  }

  getClipId(): ClipId {
    return this.clipId;
  }

  getStartTime(): number {
    return this.startTime;
  }

  getDuration(): number {
    return this.duration;
  }

  setGain(gain: number): void {
    if (gain < 0) {
      throw new Error('Gain cannot be negative');
    }
    this.gain = gain;
    this.incrementVersion();
  }

  getGain(): number {
    return this.gain;
  }

  getState(): ClipState {
    return {
      startTime: this.startTime,
      duration: this.duration,
      gain: this.gain
    };
  }

  abstract toJSON(): object;

  abstract clone(): BaseClip;
} 