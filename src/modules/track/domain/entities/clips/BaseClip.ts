import { IEntity } from '../../interfaces/IEntity';
import type { ClipId } from '../../value-objects/clips/ClipId';

export interface ClipState {
  startTime: number;
  duration: number;
  gain: number;
}

/**
 * Clip 是 Track 聚合內的實體
 * 代表音軌上的一個音頻或 MIDI 片段
 */
export abstract class BaseClip implements IEntity {
  protected _version: number = 1;
  protected _gain: number = 1.0;

  constructor(
    protected readonly clipId: ClipId,
    protected _startTime: number,
    protected _duration: number,
    protected readonly initialState?: Partial<ClipState>
  ) {
    this.validateConstructorParams();
    if (initialState) {
      this.initializeState(initialState);
    }
  }

  private validateConstructorParams(): void {
    if (this._startTime < 0) {
      throw new Error('Start time cannot be negative');
    }
    if (this._duration <= 0) {
      throw new Error('Duration must be positive');
    }
  }

  private initializeState(state: Partial<ClipState>): void {
    if (state.gain !== undefined && state.gain >= 0) {
      this._gain = state.gain;
    }
    if (state.startTime !== undefined && state.startTime >= 0) {
      this._startTime = state.startTime;
    }
    if (state.duration !== undefined && state.duration > 0) {
      this._duration = state.duration;
    }
  }

  getId(): string {
    return this.clipId.toString();
  }

  equals(other: IEntity): boolean {
    if (!(other instanceof BaseClip)) {
      return false;
    }
    return this.clipId.equals(other.clipId);
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
    return this._startTime;
  }

  setStartTime(startTime: number): void {
    if (startTime < 0) {
      throw new Error('Start time cannot be negative');
    }
    this._startTime = startTime;
    this.incrementVersion();
  }

  getDuration(): number {
    return this._duration;
  }

  setDuration(duration: number): void {
    if (duration <= 0) {
      throw new Error('Duration must be positive');
    }
    this._duration = duration;
    this.incrementVersion();
  }

  getGain(): number {
    return this._gain;
  }

  setGain(gain: number): void {
    if (gain < 0) {
      throw new Error('Gain cannot be negative');
    }
    this._gain = gain;
    this.incrementVersion();
  }

  protected getState(): ClipState {
    return {
      startTime: this._startTime,
      duration: this._duration,
      gain: this._gain
    };
  }

  abstract toJSON(): object;

  abstract clone(): BaseClip;
} 