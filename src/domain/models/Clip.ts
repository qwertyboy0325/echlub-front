import { BaseModel, BaseModelImpl } from './BaseModel';

/**
 * Clip model interface
 */
export interface Clip extends BaseModel {
  name: string;
  audioUrl: string;
  trackId: string;
  startTime: number;
  duration: number;
  position: number;
  volume: number;
  pan: number;
  muted: boolean;
  soloed: boolean;
  effects: string[];
  automation: Record<string, number[]>;
  
  updatePosition(position: number): void;
  updateStartTime(startTime: number): void;
  updateVolume(volume: number): void;
  updatePan(pan: number): void;
  toggleMute(): void;
  toggleSolo(): void;
  addEffect(effectId: string): void;
  removeEffect(effectId: string): void;
  updateAutomation(parameter: string, data: number[]): void;
}

/**
 * Clip model implementation
 */
export class ClipImpl extends BaseModelImpl implements Clip {
  name: string;
  audioUrl: string;
  trackId: string;
  startTime: number;
  duration: number;
  position: number;
  volume: number;
  pan: number;
  muted: boolean;
  soloed: boolean;
  effects: string[];
  automation: Record<string, number[]>;

  constructor(
    audioUrl: string,
    startTime: number,
    duration: number,
    position: number,
    name: string,
    id?: string
  ) {
    super(id);
    
    if (duration <= 0) {
      throw new Error('Duration must be greater than 0');
    }
    
    if (position < 0) {
      throw new Error('Position must be non-negative');
    }

    this.name = name;
    this.audioUrl = audioUrl;
    this.trackId = ''; // 將在加入軌道時設置
    this.startTime = startTime;
    this.duration = duration;
    this.position = position;
    this.volume = 1;
    this.pan = 0;
    this.muted = false;
    this.soloed = false;
    this.effects = [];
    this.automation = {};
  }

  updatePosition(position: number): void {
    if (position < 0) {
      throw new Error('Position must be non-negative');
    }
    this.position = position;
    this.incrementVersion();
  }

  updateStartTime(startTime: number): void {
    if (startTime < 0) {
      throw new Error('Start time must be non-negative');
    }
    this.startTime = startTime;
    this.incrementVersion();
  }

  updateVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    this.incrementVersion();
  }

  updatePan(pan: number): void {
    this.pan = Math.max(-1, Math.min(1, pan));
    this.incrementVersion();
  }

  toggleMute(): void {
    this.muted = !this.muted;
    this.incrementVersion();
  }

  toggleSolo(): void {
    this.soloed = !this.soloed;
    this.incrementVersion();
  }

  addEffect(effectId: string): void {
    if (!this.effects.includes(effectId)) {
      this.effects.push(effectId);
      this.incrementVersion();
    }
  }

  removeEffect(effectId: string): void {
    this.effects = this.effects.filter(id => id !== effectId);
    this.incrementVersion();
  }

  updateAutomation(parameter: string, data: number[]): void {
    this.automation[parameter] = data;
    this.incrementVersion();
  }
} 