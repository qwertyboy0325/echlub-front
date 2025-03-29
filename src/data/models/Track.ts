import { BaseModel, BaseModelImpl } from './BaseModel';
import { Clip } from './Clip';
import { UUIDGenerator } from '../../utils/uuid';

/**
 * Track model interface
 */
export interface Track extends BaseModel {
  name: string;
  type: 'audio' | 'midi' | 'aux';
  clips: string[];
  volume: number;
  pan: number;
  muted: boolean;
  soloed: boolean;
  effects: string[];
  automation: Record<string, number[]>;
  inputGain: number;
  outputGain: number;
  color: string;
  height: number;
  visible: boolean;
}

/**
 * Track model implementation
 */
export class TrackImpl extends BaseModelImpl implements Track {
  name: string;
  type: 'audio' | 'midi' | 'aux';
  clips: string[];
  volume: number;
  pan: number;
  muted: boolean;
  soloed: boolean;
  effects: string[];
  automation: Record<string, number[]>;
  inputGain: number;
  outputGain: number;
  color: string;
  height: number;
  visible: boolean;

  constructor(data: Partial<Track>) {
    super(data);
    this.name = data.name || 'Untitled Track';
    this.type = data.type || 'audio';
    this.clips = data.clips || [];
    this.volume = data.volume ?? 1;
    this.pan = data.pan ?? 0;
    this.muted = data.muted || false;
    this.soloed = data.soloed || false;
    this.effects = data.effects || [];
    this.automation = data.automation || {};
    this.inputGain = data.inputGain ?? 1;
    this.outputGain = data.outputGain ?? 1;
    this.color = data.color || '#808080';
    this.height = data.height || 100;
    this.visible = data.visible ?? true;
  }

  /**
   * Add clip to track
   */
  addClip(clipId: string): void {
    if (!this.clips.includes(clipId)) {
      this.clips.push(clipId);
      this.update();
    }
  }

  /**
   * Remove clip from track
   */
  removeClip(clipId: string): void {
    this.clips = this.clips.filter(id => id !== clipId);
    this.update();
  }

  /**
   * Update track volume
   */
  updateVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    this.update();
  }

  /**
   * Update track pan
   */
  updatePan(pan: number): void {
    this.pan = Math.max(-1, Math.min(1, pan));
    this.update();
  }

  /**
   * Toggle track mute
   */
  toggleMute(): void {
    this.muted = !this.muted;
    this.update();
  }

  /**
   * Toggle track solo
   */
  toggleSolo(): void {
    this.soloed = !this.soloed;
    this.update();
  }

  /**
   * Add effect to track
   */
  addEffect(effectId: string): void {
    if (!this.effects.includes(effectId)) {
      this.effects.push(effectId);
      this.update();
    }
  }

  /**
   * Remove effect from track
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

  /**
   * Update track input gain
   */
  updateInputGain(gain: number): void {
    this.inputGain = Math.max(0, gain);
    this.update();
  }

  /**
   * Update track output gain
   */
  updateOutputGain(gain: number): void {
    this.outputGain = Math.max(0, gain);
    this.update();
  }

  /**
   * Update track color
   */
  updateColor(color: string): void {
    this.color = color;
    this.update();
  }

  /**
   * Update track height
   */
  updateHeight(height: number): void {
    this.height = Math.max(50, Math.min(300, height));
    this.update();
  }

  /**
   * Toggle track visibility
   */
  toggleVisibility(): void {
    this.visible = !this.visible;
    this.update();
  }
}

/**
 * Audio Clip Model
 * Represents an audio clip in a track
 */
export interface AudioClip {
    id: string;
    trackId: string;
    name: string;
    startTime: number;
    duration: number;
    loop: boolean;
    loopStart: number;
    loopEnd: number;
    audioData: AudioData;
    createdAt: number;
    updatedAt: number;
}

/**
 * Audio Data Model
 * Represents the actual audio data
 */
export interface AudioData {
    buffer: Float32Array;
    sampleRate: number;
    channels: number;
    duration: number;
}

/**
 * Effect Model
 * Represents an audio effect
 */
export interface Effect {
    id: string;
    type: string;
    parameters: Record<string, number>;
    enabled: boolean;
    createdAt: number;
    updatedAt: number;
}

/**
 * Track Factory
 * Creates and manages track instances
 */
export class TrackFactory {
    // Create new track
    static createTrack(params: Partial<Track>): Track {
        const now = Date.now();
        return {
            id: params.id || UUIDGenerator.generate(),
            name: params.name || 'New Track',
            type: params.type || 'audio',
            volume: params.volume ?? 1,
            pan: params.pan ?? 0,
            muted: params.muted ?? false,
            soloed: params.soloed ?? false,
            clips: params.clips || [],
            effects: params.effects || [],
            createdAt: params.createdAt || now,
            updatedAt: now,
            automation: params.automation || {},
            inputGain: params.inputGain ?? 1,
            outputGain: params.outputGain ?? 1,
            color: params.color || '#808080',
            height: params.height || 100,
            visible: params.visible ?? true
        };
    }
    
    // Create new audio clip
    static createAudioClip(params: Partial<AudioClip>): AudioClip {
        const now = Date.now();
        return {
            id: params.id || UUIDGenerator.generate(),
            trackId: params.trackId || '',
            name: params.name || 'New Clip',
            startTime: params.startTime ?? 0,
            duration: params.duration ?? 0,
            loop: params.loop ?? false,
            loopStart: params.loopStart ?? 0,
            loopEnd: params.loopEnd ?? 0,
            audioData: params.audioData || {
                buffer: new Float32Array(),
                sampleRate: 44100,
                channels: 2,
                duration: 0
            },
            createdAt: params.createdAt || now,
            updatedAt: now
        };
    }
    
    // Create new effect
    static createEffect(params: Partial<Effect>): Effect {
        const now = Date.now();
        return {
            id: params.id || UUIDGenerator.generate(),
            type: params.type || '',
            parameters: params.parameters || {},
            enabled: params.enabled ?? true,
            createdAt: params.createdAt || now,
            updatedAt: now
        };
    }
    
    // Update track
    static updateTrack(track: Track, updates: Partial<Track>): Track {
        return {
            ...track,
            ...updates,
            updatedAt: Date.now()
        };
    }
    
    // Update audio clip
    static updateAudioClip(clip: AudioClip, updates: Partial<AudioClip>): AudioClip {
        return {
            ...clip,
            ...updates,
            updatedAt: Date.now()
        };
    }
    
    // Update effect
    static updateEffect(effect: Effect, updates: Partial<Effect>): Effect {
        return {
            ...effect,
            ...updates,
            updatedAt: Date.now()
        };
    }
} 