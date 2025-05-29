import { DomainError } from '../../domain/errors/DomainError';
import { Track } from '../../domain/aggregates/Track';
import { AudioClip } from '../../domain/entities/AudioClip';
import { MidiClip } from '../../domain/entities/MidiClip';
import { MidiNote } from '../../domain/entities/MidiNote';
import { TrackId } from '../../domain/value-objects/TrackId';
import { ClipId } from '../../domain/value-objects/ClipId';
import { ToneJsAudioEngine, AudioTrackConfig, AudioEffectConfig, TransportState } from '../../infrastructure/audio/ToneJsAudioEngine';
import { RealEventBus } from '../../infrastructure/events/RealEventBus';

/**
 * Track Mixer State
 */
export interface TrackMixerState {
  trackId: string;
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  effects: AudioEffectConfig[];
  instrumentType?: string;
}

/**
 * Playback Session
 */
export interface PlaybackSession {
  id: string;
  tracks: Map<string, TrackMixerState>;
  masterVolume: number;
  transportState: TransportState;
  isRecording: boolean;
  recordingTrackId?: string;
}

/**
 * Audio Events
 */
export interface ToneJsAudioEngineEvents {
  onTrackCreated: (trackId: string, config: TrackMixerState) => void;
  onTrackUpdated: (trackId: string, config: TrackMixerState) => void;
  onClipScheduled: (trackId: string, clipId: string, startTime: string) => void;
  onTransportStateChanged: (state: TransportState) => void;
  onMixerStateChanged: (session: PlaybackSession) => void;
  onError: (error: Error) => void;
}

/**
 * Tone.js Integrated Adapter
 * Integrates Tone.js audio engine with domain model and event sourcing
 * Provides professional mixing capabilities with domain-driven design
 */
export class ToneJsIntegratedAdapter {
  private audioEngine: ToneJsAudioEngine;
  private eventBus: RealEventBus;
  private currentSession: PlaybackSession | null = null;
  private trackConfigs: Map<string, TrackMixerState> = new Map();
  
  private isInitialized: boolean = false;
  private events: Partial<ToneJsAudioEngineEvents> = {};

  constructor(eventBus?: RealEventBus) {
    this.audioEngine = new ToneJsAudioEngine();
    this.eventBus = eventBus || new RealEventBus();
    this.setupEventBusSubscriptions();
  }

  /**
   * Initialize the integrated adapter
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('ToneJsIntegratedAdapter already initialized, skipping...');
      return;
    }

    try {
      console.log('🔧 [ToneJsIntegratedAdapter] Starting initialization...');
      
      // Initialize Tone.js audio engine
      console.log('🔧 [ToneJsIntegratedAdapter] Initializing audio engine...');
      await this.audioEngine.initialize();
      console.log('✅ [ToneJsIntegratedAdapter] Audio engine initialized');

      // Setup audio engine callbacks
      console.log('🔧 [ToneJsIntegratedAdapter] Setting up audio engine callbacks...');
      this.audioEngine.setEventCallbacks({
        onTransportStart: () => {
          this.handleTransportStateChange();
        },
        onTransportStop: () => {
          this.handleTransportStateChange();
        },
        onTransportPause: () => {
          this.handleTransportStateChange();
        },
        onPositionChange: (position: string) => {
          this.handlePositionChange(position);
        },
        onError: (error: Error) => {
          this.events.onError?.(error);
        }
      });
      console.log('✅ [ToneJsIntegratedAdapter] Audio engine callbacks set');

      // Create default session
      console.log('🔧 [ToneJsIntegratedAdapter] Creating default session...');
      this.currentSession = this.createDefaultSession();
      
      if (this.currentSession) {
        console.log(`✅ [ToneJsIntegratedAdapter] Default session created: ${this.currentSession.id}`);
      } else {
        throw new Error('Failed to create default session');
      }

      this.isInitialized = true;
      console.log('✅ Tone.js Integrated Adapter initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize Tone.js Integrated Adapter:', error);
      this.isInitialized = false;
      this.currentSession = null;
      throw DomainError.operationNotPermitted('initialize', `Integrated adapter initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Create audio track from domain Track aggregate
   */
  public async createTrackFromAggregate(track: Track): Promise<void> {
    if (!this.isInitialized || !this.currentSession) {
      throw DomainError.operationNotPermitted('createTrackFromAggregate', 'Adapter not initialized');
    }

    try {
      const trackId = track.trackId.toString();
      const trackType = track.trackType.value;
      
      // Create mixer state for this track
      const mixerState: TrackMixerState = {
        trackId,
        volume: 0.8,
        pan: 0,
        muted: false,
        solo: false,
        effects: [],
        instrumentType: trackType === 'INSTRUMENT' ? 'synth' : undefined
      };

      // Create audio track configuration
      const audioConfig: AudioTrackConfig = {
        id: trackId,
        name: track.metadata?.name || `Track ${trackId}`,
        volume: mixerState.volume,
        pan: mixerState.pan,
        muted: mixerState.muted,
        solo: mixerState.solo,
        effects: mixerState.effects
      };

      // Create track in audio engine
      if (trackType === 'AUDIO') {
        this.audioEngine.createAudioTrack(audioConfig);
      } else if (trackType === 'INSTRUMENT') {
        this.audioEngine.createMidiTrack(audioConfig);
      }

      // Store track configuration
      this.trackConfigs.set(trackId, mixerState);
      this.currentSession.tracks.set(trackId, mixerState);

      // Notify listeners
      this.events.onTrackCreated?.(trackId, mixerState);
      this.events.onMixerStateChanged?.(this.currentSession);

      console.log(`Track created from aggregate: ${trackId} (${trackType})`);

    } catch (error) {
      console.error('Error creating track from aggregate:', error);
      throw DomainError.operationNotPermitted('createTrackFromAggregate', `Failed to create track: ${error}`);
    }
  }

  /**
   * Schedule audio clip from domain AudioClip entity
   */
  public async scheduleAudioClipFromEntity(
    trackId: string,
    audioClip: AudioClip,
    startTime: string,
    options: {
      fadeIn?: string;
      fadeOut?: string;
      playbackRate?: number;
      loop?: boolean;
    } = {}
  ): Promise<void> {
    try {
      const clipId = audioClip.clipId.toString();
      const audioSourceUrl = audioClip.audioSource.url;
      
      // Check if audio source URL is available
      if (!audioSourceUrl) {
        throw DomainError.operationNotPermitted('scheduleAudioClipFromEntity', 'Audio source URL is not available');
      }
      
      // Load audio sample if not already loaded
      await this.audioEngine.loadAudioSample(audioSourceUrl, clipId);
      
      // Calculate duration from clip range
      const duration = `${audioClip.range.length}`;
      
      // Schedule the clip
      this.audioEngine.scheduleAudioClip(
        trackId,
        clipId,
        startTime,
        duration,
        options
      );

      // Notify listeners
      this.events.onClipScheduled?.(trackId, clipId, startTime);

      console.log(`Audio clip scheduled: ${clipId} on track ${trackId}`);

    } catch (error) {
      console.error('Error scheduling audio clip:', error);
      throw DomainError.operationNotPermitted('scheduleAudioClipFromEntity', `Failed to schedule clip: ${error}`);
    }
  }

  /**
   * Schedule MIDI clip from domain MidiClip entity
   */
  public async scheduleMidiClipFromEntity(
    trackId: string,
    midiClip: MidiClip,
    startTime: string
  ): Promise<void> {
    try {
      const clipId = midiClip.clipId.toString();
      const notes = midiClip.notes;
      
      console.log(`[ToneJsIntegratedAdapter] Scheduling MIDI clip: ${clipId}`);
      console.log(`[ToneJsIntegratedAdapter] Track ID: ${trackId}`);
      console.log(`[ToneJsIntegratedAdapter] Start time: ${startTime}`);
      console.log(`[ToneJsIntegratedAdapter] Notes count: ${notes.length}`);
      console.log(`[ToneJsIntegratedAdapter] Notes data:`, notes.map(n => ({
        pitch: n.pitch,
        velocity: n.velocity,
        start: n.range.start,
        length: n.range.length
      })));
      
      // Schedule MIDI notes
      this.audioEngine.scheduleMidiNotes(trackId, notes, startTime);

      // Notify listeners
      this.events.onClipScheduled?.(trackId, clipId, startTime);

      console.log(`MIDI clip scheduled: ${clipId} on track ${trackId} with ${notes.length} notes`);

    } catch (error) {
      console.error('Error scheduling MIDI clip:', error);
      throw DomainError.operationNotPermitted('scheduleMidiClipFromEntity', `Failed to schedule MIDI clip: ${error}`);
    }
  }

  /**
   * Schedule entire track from domain Track aggregate
   */
  public async scheduleTrackFromAggregate(track: Track, startTime: string = '0:0:0'): Promise<void> {
    try {
      const trackId = track.trackId.toString();
      
      // Ensure track exists in mixer
      if (!this.trackConfigs.has(trackId)) {
        await this.createTrackFromAggregate(track);
      }

      // Schedule all clips in the track
      const clipsArray = Array.from(track.clips.values());
      for (const clip of clipsArray) {
        const clipStartTime = `${startTime} + ${clip.range.start}`;
        
        if (clip instanceof AudioClip) {
          await this.scheduleAudioClipFromEntity(trackId, clip, clipStartTime);
        } else if (clip instanceof MidiClip) {
          await this.scheduleMidiClipFromEntity(trackId, clip, clipStartTime);
        }
      }

      console.log(`Track scheduled: ${trackId} with ${clipsArray.length} clips`);

    } catch (error) {
      console.error('Error scheduling track:', error);
      throw DomainError.operationNotPermitted('scheduleTrackFromAggregate', `Failed to schedule track: ${error}`);
    }
  }

  /**
   * Update track mixer settings
   */
  public updateTrackMixer(trackId: string, updates: Partial<TrackMixerState>): void {
    const currentConfig = this.trackConfigs.get(trackId);
    if (!currentConfig || !this.currentSession) {
      throw DomainError.operationNotPermitted('updateTrackMixer', 'Track not found');
    }

    try {
      // Update configuration
      const newConfig = { ...currentConfig, ...updates };
      this.trackConfigs.set(trackId, newConfig);
      this.currentSession.tracks.set(trackId, newConfig);

      // Apply changes to audio engine
      if (updates.volume !== undefined) {
        this.audioEngine.setTrackVolume(trackId, updates.volume);
      }
      
      if (updates.pan !== undefined) {
        this.audioEngine.setTrackPan(trackId, updates.pan);
      }
      
      if (updates.muted !== undefined) {
        this.audioEngine.setTrackMute(trackId, updates.muted);
      }
      
      if (updates.solo !== undefined) {
        this.audioEngine.setTrackSolo(trackId, updates.solo);
      }

      // Add effects if specified
      if (updates.effects) {
        updates.effects.forEach(effect => {
          this.audioEngine.addTrackEffect(trackId, effect);
        });
      }

      // Notify listeners
      this.events.onTrackUpdated?.(trackId, newConfig);
      this.events.onMixerStateChanged?.(this.currentSession);

      console.log(`Track mixer updated: ${trackId}`);

    } catch (error) {
      console.error('Error updating track mixer:', error);
      throw DomainError.operationNotPermitted('updateTrackMixer', `Failed to update mixer: ${error}`);
    }
  }

  /**
   * Transport controls
   */
  public startPlayback(): void {
    this.audioEngine.startTransport();
  }

  public stopPlayback(): void {
    this.audioEngine.stopTransport();
  }

  public pausePlayback(): void {
    this.audioEngine.pauseTransport();
  }

  public setBpm(bpm: number): void {
    this.audioEngine.setBpm(bpm);
    this.handleTransportStateChange();
  }

  public setPosition(position: string): void {
    this.audioEngine.setPosition(position);
    this.handleTransportStateChange();
  }

  /**
   * Master controls
   */
  public setMasterVolume(volume: number): void {
    this.audioEngine.setMasterVolume(volume);
    
    if (this.currentSession) {
      this.currentSession.masterVolume = volume;
      this.events.onMixerStateChanged?.(this.currentSession);
    }
  }

  /**
   * Get current session state
   */
  public getCurrentSession(): PlaybackSession | null {
    return this.currentSession;
  }

  /**
   * Get transport state
   */
  public getTransportState(): TransportState {
    return this.audioEngine.getTransportState();
  }

  /**
   * Set event handlers
   */
  public setEventHandlers(events: Partial<ToneJsAudioEngineEvents>): void {
    this.events = { ...this.events, ...events };
  }

  /**
   * Dispose of the adapter
   */
  public async dispose(): Promise<void> {
    try {
      await this.audioEngine.dispose();
      this.eventBus.dispose();
      this.trackConfigs.clear();
      this.currentSession = null;
      this.isInitialized = false;
      console.log('Tone.js Integrated Adapter disposed');
    } catch (error) {
      console.error('Error disposing integrated adapter:', error);
    }
  }

  // Private methods

  private createDefaultSession(): PlaybackSession {
    try {
      console.log('🔧 [ToneJsIntegratedAdapter] Getting transport state for session...');
      const transportState = this.audioEngine.getTransportState();
      console.log('✅ [ToneJsIntegratedAdapter] Transport state obtained');
      
      const session = {
        id: `session_${Date.now()}`,
        tracks: new Map(),
        masterVolume: 0.8,
        transportState,
        isRecording: false
      };
      
      console.log(`🔧 [ToneJsIntegratedAdapter] Session created with ID: ${session.id}`);
      return session;
    } catch (error) {
      console.error('❌ [ToneJsIntegratedAdapter] Error creating default session:', error);
      
      // Fallback session with minimal transport state
      const fallbackSession = {
        id: `session_${Date.now()}`,
        tracks: new Map(),
        masterVolume: 0.8,
        transportState: {
          isPlaying: false,
          isPaused: false,
          position: '0:0:0',
          bpm: 120,
          timeSignature: [4, 4] as [number, number],
          swing: 0,
          loopStart: '0:0:0',
          loopEnd: '4:0:0',
          loopEnabled: false
        },
        isRecording: false
      };
      
      console.log(`🔧 [ToneJsIntegratedAdapter] Fallback session created with ID: ${fallbackSession.id}`);
      return fallbackSession;
    }
  }

  private handleTransportStateChange(): void {
    if (this.currentSession) {
      this.currentSession.transportState = this.audioEngine.getTransportState();
      this.events.onTransportStateChanged?.(this.currentSession.transportState);
      this.events.onMixerStateChanged?.(this.currentSession);
    }
  }

  private handlePositionChange(position: string): void {
    if (this.currentSession) {
      this.currentSession.transportState.position = position;
      this.events.onTransportStateChanged?.(this.currentSession.transportState);
    }
  }

  private setupEventBusSubscriptions(): void {
    // Subscribe to domain events for automatic audio scheduling
    this.eventBus.subscribe('TrackCreated', async (event: { aggregateId: string; eventName: string }) => {
      try {
        // This would require access to the track repository to get the full aggregate
        console.log('Track created event received:', event.aggregateId);
      } catch (error) {
        console.error('Error handling TrackCreated event:', error);
      }
    });

    this.eventBus.subscribe('ClipAddedToTrack', async (event: { aggregateId: string; eventName: string }) => {
      try {
        // This would trigger automatic scheduling of the new clip
        console.log('Clip added event received:', event);
      } catch (error) {
        console.error('Error handling ClipAddedToTrack event:', error);
      }
    });

    this.eventBus.subscribe('MidiNoteAdded', async (event: { aggregateId: string; eventName: string }) => {
      try {
        // This would trigger re-scheduling of the affected MIDI clip
        console.log('MIDI note added event received:', event);
      } catch (error) {
        console.error('Error handling MidiNoteAdded event:', error);
      }
    });
  }

  // Static utility methods

  /**
   * Check if Tone.js is available
   */
  public static isSupported(): boolean {
    return ToneJsAudioEngine.isAvailable();
  }

  /**
   * Get Tone.js version
   */
  public static getToneJsVersion(): string {
    return ToneJsAudioEngine.getVersion();
  }

  /**
   * Create default track mixer state
   */
  public static createDefaultTrackMixer(trackId: string, trackType: 'AUDIO' | 'INSTRUMENT'): TrackMixerState {
    return {
      trackId,
      volume: 0.8,
      pan: 0,
      muted: false,
      solo: false,
      effects: [],
      instrumentType: trackType === 'INSTRUMENT' ? 'synth' : undefined
    };
  }

  /**
   * Create reverb effect configuration
   */
  public static createReverbEffect(roomSize: number = 0.3, decay: number = 1.5): AudioEffectConfig {
    return {
      id: `reverb_${Date.now()}`,
      type: 'reverb',
      enabled: true,
      parameters: {
        roomSize,
        decay
      }
    };
  }

  /**
   * Create delay effect configuration
   */
  public static createDelayEffect(delayTime: string = '8n', feedback: number = 0.3): AudioEffectConfig {
    return {
      id: `delay_${Date.now()}`,
      type: 'delay',
      enabled: true,
      parameters: {
        delayTime,
        feedback
      }
    };
  }

  /**
   * Create compressor effect configuration
   */
  public static createCompressorEffect(threshold: number = -24, ratio: number = 4): AudioEffectConfig {
    return {
      id: `compressor_${Date.now()}`,
      type: 'compressor',
      enabled: true,
      parameters: {
        threshold,
        ratio,
        attack: 0.003,
        release: 0.1
      }
    };
  }

  /**
   * Play a single MIDI note immediately (for testing/preview)
   */
  public async playMidiNote(
    note: number,
    velocity: number = 127,
    duration: number = 1000,
    instrumentType: string = 'synth'
  ): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Create a temporary synthesizer for immediate playback using Tone.js directly
      let synth: any;
      switch (instrumentType) {
        case 'fmSynth':
          synth = new (window as any).Tone.FMSynth();
          break;
        case 'amSynth':
          synth = new (window as any).Tone.AMSynth();
          break;
        case 'polySynth':
          synth = new (window as any).Tone.PolySynth();
          break;
        case 'monoSynth':
          synth = new (window as any).Tone.MonoSynth();
          break;
        default:
          synth = new (window as any).Tone.Synth();
      }
      
      // 設置音量以避免過響
      synth.volume.value = -12; // 降低音量
      synth.toDestination();
      
      // Convert MIDI note to frequency using Tone.js
      const frequency = (window as any).Tone.Frequency(note, 'midi');
      const normalizedVelocity = velocity / 127;
      const durationInSeconds = duration / 1000;
      
      // 使用 Tone.js 的 now() 來確保精確的時間控制
      const now = (window as any).Tone.now();
      
      // 播放音符，使用精確的時間控制
      synth.triggerAttack(frequency, now, normalizedVelocity);
      
      // 在指定時間後停止音符
      synth.triggerRelease(now + durationInSeconds);
      
      // 確保合成器在音符結束後被清理
      setTimeout(() => {
        try {
          // 強制停止所有聲音
          if (synth && typeof synth.triggerRelease === 'function') {
            synth.triggerRelease();
          }
          
          // 斷開連接
          if (synth && typeof synth.disconnect === 'function') {
            synth.disconnect();
          }
          
          // 清理合成器
          if (synth && typeof synth.dispose === 'function') {
            synth.dispose();
          }
          
          console.log(`MIDI note synth disposed: ${note}`);
        } catch (disposeError) {
          console.warn(`Error disposing synth for note ${note}:`, disposeError);
        }
      }, duration + 500); // 給更多時間確保音符完全結束

      console.log(`MIDI note played: ${note} (${frequency}Hz) for ${durationInSeconds}s`);

    } catch (error) {
      console.error('Error playing MIDI note:', error);
      throw DomainError.operationNotPermitted('playMidiNote', `Failed to play MIDI note: ${error}`);
    }
  }

  /**
   * Debug method: Test MIDI note playback directly
   */
  public async testMidiNote(trackId: string, pitch: number = 60, velocity: number = 100, duration: number = 1000): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      await this.audioEngine.testMidiNote(trackId, pitch, velocity, duration);
    } catch (error) {
      console.error('Error testing MIDI note:', error);
      throw DomainError.operationNotPermitted('testMidiNote', `Failed to test MIDI note: ${error}`);
    }
  }

  /**
   * Debug method: Check audio chain connectivity
   */
  public debugAudioChain(trackId: string): void {
    try {
      if (!this.isInitialized) {
        console.error('❌ Adapter not initialized');
        return;
      }
      
      this.audioEngine.debugAudioChain(trackId);
    } catch (error) {
      console.error('Error debugging audio chain:', error);
    }
  }
} 