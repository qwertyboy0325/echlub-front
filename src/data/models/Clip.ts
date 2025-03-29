import { BaseModel, BaseModelImpl } from './BaseModel';
import { Audio } from './Audio';

/**
 * Clip model interface
 */
export interface Clip extends BaseModel {
  name: string;
  audioId: string;
  startTime: number;
  duration: number;
  volume: number;
  pan: number;
  muted: boolean;
  soloed: boolean;
  effects: string[];
  automation: Record<string, number[]>;
}

/**
 * Clip model implementation
 */
export class ClipImpl extends BaseModelImpl implements Clip {
  name: string;
  audioId: string;
  startTime: number;
  duration: number;
  volume: number;
  pan: number;
  muted: boolean;
  soloed: boolean;
  effects: string[];
  automation: Record<string, number[]>;

  constructor(data: Partial<Clip>) {
    super(data);
    this.name = data.name || 'Untitled Clip';
    this.audioId = data.audioId || '';
    this.startTime = data.startTime || 0;
    this.duration = data.duration || 0;
    this.volume = data.volume ?? 1;
    this.pan = data.pan ?? 0;
    this.muted = data.muted || false;
    this.soloed = data.soloed || false;
    this.effects = data.effects || [];
    this.automation = data.automation || {};
  }

  /**
   * Update clip position
   */
  updatePosition(startTime: number): void {
    this.startTime = startTime;
    this.update();
  }

  /**
   * Update clip volume
   */
  updateVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    this.update();
  }

  /**
   * Update clip pan
   */
  updatePan(pan: number): void {
    this.pan = Math.max(-1, Math.min(1, pan));
    this.update();
  }

  /**
   * Toggle clip mute
   */
  toggleMute(): void {
    this.muted = !this.muted;
    this.update();
  }

  /**
   * Toggle clip solo
   */
  toggleSolo(): void {
    this.soloed = !this.soloed;
    this.update();
  }

  /**
   * Add effect to clip
   */
  addEffect(effectId: string): void {
    if (!this.effects.includes(effectId)) {
      this.effects.push(effectId);
      this.update();
    }
  }

  /**
   * Remove effect from clip
   */
  removeEffect(effectId: string): void {
    this.effects = this.effects.filter(id => id !== effectId);
    this.update();
  }

  /**
   * Update automation data
   */
  updateAutomation(parameter: string, data: number[]): void {
    this.automation[parameter] = data;
    this.update();
  }
} 