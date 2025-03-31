import { BaseModel, BaseModelImpl } from './BaseModel';
import type { Clip } from './Clip';

/**
 * Track model interface
 */
export interface Track extends BaseModel {
  name: string;
  projectId: string;
  clips: Clip[];
  volume: number;
  pan: number;
  reverb: number;
  
  addClip(clip: Clip): void;
  removeClip(clipId: string): void;
  updateVolume(volume: number): void;
  updatePan(pan: number): void;
  updateReverb(reverb: number): void;
}

/**
 * Track model implementation
 */
export class TrackImpl extends BaseModelImpl implements Track {
  name: string;
  projectId: string;
  clips: Clip[];
  volume: number;
  pan: number;
  reverb: number;

  constructor(name: string) {
    super();
    
    this.name = name;
    this.projectId = ''; // 將在加入專案時設置
    this.clips = [];
    this.volume = 1;
    this.pan = 0;
    this.reverb = 0;
  }

  addClip(clip: Clip): void {
    this.clips.push(clip);
    this.incrementVersion();
  }

  removeClip(clipId: string): void {
    this.clips = this.clips.filter(clip => clip.id !== clipId);
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

  updateReverb(reverb: number): void {
    this.reverb = Math.max(0, Math.min(1, reverb));
    this.incrementVersion();
  }
} 