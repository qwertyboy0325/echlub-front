import { DomainError } from '../../domain/errors/DomainError';
import { AudioClip } from '../../domain/entities/AudioClip';
import { ClipId } from '../../domain/value-objects/ClipId';
import { TimeRangeVO } from '../../domain/value-objects/TimeRangeVO';

/**
 * Audio Context State
 */
export interface AudioContextState {
  isInitialized: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  bpm: number;
  volume: number;
}

/**
 * Audio Clip Data
 */
export interface AudioClipData {
  clipId: string;
  audioBuffer: AudioBuffer;
  source?: AudioBufferSourceNode;
  gainNode?: GainNode;
  startTime: number;
  duration: number;
  loop: boolean;
  fadeIn: number;
  fadeOut: number;
}

/**
 * Audio Engine Events
 */
export interface AudioEngineEvents {
  onPlaybackStart: () => void;
  onPlaybackStop: () => void;
  onPlaybackPause: () => void;
  onTimeUpdate: (currentTime: number) => void;
  onClipStart: (clipId: string) => void;
  onClipEnd: (clipId: string) => void;
  onError: (error: Error) => void;
}

// Web Audio API type extensions for cross-browser compatibility
declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

/**
 * Real Audio Adapter
 * Provides actual audio functionality using Web Audio API
 * Supports audio clip playback, scheduling, and real-time effects
 */
export class RealAudioAdapter {
  private audioContext: AudioContext | null = null;
  private masterGainNode: GainNode | null = null;
  private scheduledClips: Map<string, AudioClipData> = new Map();
  private loadedBuffers: Map<string, AudioBuffer> = new Map();
  
  private state: AudioContextState = {
    isInitialized: false,
    isPlaying: false,
    isPaused: false,
    currentTime: 0,
    bpm: 120,
    volume: 1.0
  };

  private events: Partial<AudioEngineEvents> = {};
  private animationFrameId: number | null = null;
  private startTimeOffset: number = 0;

  /**
   * Initialize the audio adapter
   */
  public async initialize(): Promise<void> {
    if (this.state.isInitialized) {
      return;
    }

    try {
      // Create AudioContext with cross-browser compatibility
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error('Web Audio API is not supported in this browser');
      }
      
      this.audioContext = new AudioContextClass();
      
      // Create master gain node
      this.masterGainNode = this.audioContext.createGain();
      this.masterGainNode.connect(this.audioContext.destination);
      this.masterGainNode.gain.value = this.state.volume;

      // Resume audio context if suspended (required by some browsers)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.state.isInitialized = true;
      console.log('Real Audio Adapter initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize Real Audio Adapter:', error);
      throw DomainError.operationNotPermitted('initialize', 'Audio context creation failed');
    }
  }

  /**
   * Load audio file and create buffer
   */
  public async loadAudioFile(url: string, clipId?: string): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw DomainError.operationNotPermitted('loadAudioFile', 'Audio adapter not initialized');
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio file: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      // Cache the buffer if clipId provided
      if (clipId) {
        this.loadedBuffers.set(clipId, audioBuffer);
      }

      console.log(`Audio file loaded: ${url}, duration: ${audioBuffer.duration}s`);
      return audioBuffer;

    } catch (error) {
      console.error('Error loading audio file:', error);
      throw DomainError.operationNotPermitted('loadAudioFile', `Failed to load audio: ${error}`);
    }
  }

  /**
   * Schedule audio clip for playback
   */
  public async scheduleAudioClip(
    clipId: string,
    audioBuffer: AudioBuffer,
    startTime: number,
    options: {
      duration?: number;
      loop?: boolean;
      gain?: number;
      fadeIn?: number;
      fadeOut?: number;
    } = {}
  ): Promise<void> {
    if (!this.audioContext || !this.masterGainNode) {
      throw DomainError.operationNotPermitted('scheduleAudioClip', 'Audio adapter not initialized');
    }

    try {
      // Create audio clip data
      const clipData: AudioClipData = {
        clipId,
        audioBuffer,
        startTime,
        duration: options.duration || audioBuffer.duration,
        loop: options.loop || false,
        fadeIn: options.fadeIn || 0,
        fadeOut: options.fadeOut || 0
      };

      // Create source and gain nodes
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();

      source.buffer = audioBuffer;
      source.loop = clipData.loop;
      
      // Set gain
      gainNode.gain.value = options.gain || 1.0;

      // Connect nodes
      source.connect(gainNode);
      gainNode.connect(this.masterGainNode);

      // Store references
      clipData.source = source;
      clipData.gainNode = gainNode;

      // Apply fade in/out
      if (clipData.fadeIn > 0) {
        this.applyFadeIn(gainNode, clipData.fadeIn);
      }
      
      if (clipData.fadeOut > 0) {
        this.applyFadeOut(gainNode, clipData.duration - clipData.fadeOut, clipData.fadeOut);
      }

      // Schedule playback
      const when = this.audioContext.currentTime + startTime;
      source.start(when, 0, clipData.duration);

      // Handle clip end
      source.onended = () => {
        this.handleClipEnd(clipId);
      };

      this.scheduledClips.set(clipId, clipData);
      console.log(`Audio clip scheduled: ${clipId} at ${startTime}s`);

    } catch (error) {
      console.error('Error scheduling audio clip:', error);
      throw DomainError.operationNotPermitted('scheduleAudioClip', `Failed to schedule clip: ${error}`);
    }
  }

  /**
   * Start playback
   */
  public async startPlayback(): Promise<void> {
    if (!this.audioContext) {
      throw DomainError.operationNotPermitted('startPlayback', 'Audio adapter not initialized');
    }

    try {
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.state.isPlaying = true;
      this.state.isPaused = false;
      this.startTimeOffset = this.audioContext.currentTime - this.state.currentTime;

      // Start time update loop
      this.startTimeUpdateLoop();

      this.events.onPlaybackStart?.();
      console.log('Playback started');

    } catch (error) {
      console.error('Error starting playback:', error);
      throw DomainError.operationNotPermitted('startPlayback', `Failed to start playback: ${error}`);
    }
  }

  /**
   * Stop playback
   */
  public async stopPlayback(): Promise<void> {
    try {
      this.state.isPlaying = false;
      this.state.isPaused = false;
      this.state.currentTime = 0;

      // Stop all scheduled clips
      this.stopAllClips();

      // Stop time update loop
      this.stopTimeUpdateLoop();

      this.events.onPlaybackStop?.();
      console.log('Playback stopped');

    } catch (error) {
      console.error('Error stopping playback:', error);
      throw DomainError.operationNotPermitted('stopPlayback', `Failed to stop playback: ${error}`);
    }
  }

  /**
   * Pause playback
   */
  public async pausePlayback(): Promise<void> {
    try {
      if (this.audioContext) {
        await this.audioContext.suspend();
      }

      this.state.isPlaying = false;
      this.state.isPaused = true;

      // Stop time update loop
      this.stopTimeUpdateLoop();

      this.events.onPlaybackPause?.();
      console.log('Playback paused');

    } catch (error) {
      console.error('Error pausing playback:', error);
      throw DomainError.operationNotPermitted('pausePlayback', `Failed to pause playback: ${error}`);
    }
  }

  /**
   * Set master volume
   */
  public setVolume(volume: number): void {
    if (volume < 0 || volume > 1) {
      throw DomainError.invalidGain(volume);
    }

    this.state.volume = volume;
    
    if (this.masterGainNode) {
      this.masterGainNode.gain.value = volume;
    }

    console.log(`Master volume set to ${volume}`);
  }

  /**
   * Set BPM
   */
  public setBpm(bpm: number): void {
    if (bpm < 30 || bpm > 300) {
      throw DomainError.invalidBpm(bpm);
    }

    this.state.bpm = bpm;
    console.log(`BPM set to ${bpm}`);
  }

  /**
   * Set playback position
   */
  public setPosition(time: number): void {
    if (time < 0) {
      throw DomainError.invalidTimeRange(time, 0);
    }

    this.state.currentTime = time;
    
    if (this.state.isPlaying && this.audioContext) {
      this.startTimeOffset = this.audioContext.currentTime - time;
    }

    console.log(`Position set to ${time}s`);
  }

  /**
   * Get current playback state
   */
  public getState(): AudioContextState {
    return { ...this.state };
  }

  /**
   * Set event handlers
   */
  public setEventHandlers(events: Partial<AudioEngineEvents>): void {
    this.events = { ...this.events, ...events };
  }

  /**
   * Unschedule audio clip
   */
  public unscheduleClip(clipId: string): void {
    const clipData = this.scheduledClips.get(clipId);
    if (clipData && clipData.source) {
      try {
        clipData.source.stop();
      } catch (error) {
        // Source might already be stopped
        console.warn(`Could not stop source for clip ${clipId}:`, error);
      }
    }
    
    this.scheduledClips.delete(clipId);
    console.log(`Audio clip unscheduled: ${clipId}`);
  }

  /**
   * Get scheduled clips
   */
  public getScheduledClips(): string[] {
    return Array.from(this.scheduledClips.keys());
  }

  /**
   * Dispose of the audio adapter
   */
  public async dispose(): Promise<void> {
    try {
      this.stopTimeUpdateLoop();
      this.stopAllClips();
      
      if (this.audioContext) {
        await this.audioContext.close();
        this.audioContext = null;
      }

      this.masterGainNode = null;
      this.scheduledClips.clear();
      this.loadedBuffers.clear();
      this.state.isInitialized = false;

      console.log('Real Audio Adapter disposed');

    } catch (error) {
      console.error('Error disposing audio adapter:', error);
    }
  }

  // Private helper methods

  private applyFadeIn(gainNode: GainNode, duration: number): void {
    if (!this.audioContext) return;

    const currentTime = this.audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, currentTime);
    gainNode.gain.linearRampToValueAtTime(gainNode.gain.value, currentTime + duration);
  }

  private applyFadeOut(gainNode: GainNode, startTime: number, duration: number): void {
    if (!this.audioContext) return;

    const currentTime = this.audioContext.currentTime;
    const fadeStartTime = currentTime + startTime;
    gainNode.gain.setValueAtTime(gainNode.gain.value, fadeStartTime);
    gainNode.gain.linearRampToValueAtTime(0, fadeStartTime + duration);
  }

  private handleClipEnd(clipId: string): void {
    this.scheduledClips.delete(clipId);
    this.events.onClipEnd?.(clipId);
    console.log(`Audio clip ended: ${clipId}`);
  }

  private stopAllClips(): void {
    for (const [clipId, clipData] of this.scheduledClips) {
      if (clipData.source) {
        try {
          clipData.source.stop();
        } catch (error) {
          console.warn(`Could not stop source for clip ${clipId}:`, error);
        }
      }
    }
    this.scheduledClips.clear();
  }

  private startTimeUpdateLoop(): void {
    if (this.animationFrameId !== null) {
      return;
    }

    const updateTime = () => {
      if (this.state.isPlaying && this.audioContext) {
        this.state.currentTime = this.audioContext.currentTime - this.startTimeOffset;
        this.events.onTimeUpdate?.(this.state.currentTime);
      }

      if (this.state.isPlaying) {
        this.animationFrameId = requestAnimationFrame(updateTime);
      }
    };

    this.animationFrameId = requestAnimationFrame(updateTime);
  }

  private stopTimeUpdateLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  // Static utility methods

  /**
   * Check if Web Audio API is supported
   */
  public static isSupported(): boolean {
    return !!(window.AudioContext || window.webkitAudioContext);
  }

  /**
   * Get audio context sample rate
   */
  public getSampleRate(): number {
    return this.audioContext?.sampleRate || 44100;
  }

  /**
   * Create audio buffer from array
   */
  public createBuffer(channels: number, length: number, sampleRate?: number): AudioBuffer | null {
    if (!this.audioContext) return null;
    
    return this.audioContext.createBuffer(
      channels,
      length,
      sampleRate || this.audioContext.sampleRate
    );
  }
} 