import { DomainError } from '../../domain/errors/DomainError';
import { AudioClip } from '../../domain/entities/AudioClip';
import { MidiNote } from '../../domain/entities/MidiNote';
import { InstrumentRef } from '../../domain/value-objects/InstrumentRef';

// Tone.js imports (would be installed via npm)
declare const Tone: any;

/**
 * Audio Track Configuration
 */
export interface AudioTrackConfig {
  id: string;
  name: string;
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  effects: AudioEffectConfig[];
}

/**
 * Audio Effect Configuration
 */
export interface AudioEffectConfig {
  id: string;
  type: 'reverb' | 'delay' | 'chorus' | 'distortion' | 'filter' | 'compressor' | 'eq';
  enabled: boolean;
  parameters: { [key: string]: any };
}

/**
 * Mixer Channel
 */
export interface MixerChannel {
  id: string;
  name: string;
  player?: any; // Tone.Player
  synth?: any; // Tone.Synth
  gainNode: any; // Tone.Gain
  panNode: any; // Tone.Panner
  effects: any[]; // Tone effects
  isMuted: boolean;
  isSolo: boolean;
}

/**
 * Transport State
 */
export interface TransportState {
  isPlaying: boolean;
  isPaused: boolean;
  position: string; // Tone.js time format
  bpm: number;
  timeSignature: [number, number];
  swing: number;
  loopStart: string;
  loopEnd: string;
  loopEnabled: boolean;
}

/**
 * Tone.js Audio Engine
 * Professional audio engine with mixing capabilities using Tone.js
 * Provides advanced audio processing, effects, and mixing features
 */
export class ToneJsAudioEngine {
  private isInitialized: boolean = false;
  private mixerChannels: Map<string, MixerChannel> = new Map();
  private masterChannel: any = null; // Tone.Gain
  private masterEffects: any[] = [];
  private loadedSamples: Map<string, any> = new Map(); // Tone.Buffer
  
  private transportState: TransportState = {
    isPlaying: false,
    isPaused: false,
    position: '0:0:0',
    bpm: 120,
    timeSignature: [4, 4],
    swing: 0,
    loopStart: '0:0:0',
    loopEnd: '4:0:0',
    loopEnabled: false
  };

  private eventCallbacks: {
    onTransportStart?: () => void;
    onTransportStop?: () => void;
    onTransportPause?: () => void;
    onPositionChange?: (position: string) => void;
    onError?: (error: Error) => void;
  } = {};

  /**
   * Initialize Tone.js audio engine
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Check if Tone.js is available
      if (typeof Tone === 'undefined') {
        throw new Error('Tone.js is not loaded. Please include Tone.js in your project.');
      }

      // Start Tone.js audio context
      await Tone.start();
      console.log('Tone.js audio context started');

      // Setup master channel
      this.masterChannel = new Tone.Gain(0.8).toDestination();
      
      // Setup master effects chain
      this.setupMasterEffects();
      
      // Configure transport
      this.setupTransport();
      
      // Setup default instruments
      await this.setupDefaultInstruments();

      this.isInitialized = true;
      console.log('Tone.js Audio Engine initialized successfully');

    } catch (error) {
      console.error('Failed to initialize Tone.js Audio Engine:', error);
      throw DomainError.operationNotPermitted('initialize', 'Tone.js audio engine initialization failed');
    }
  }

  /**
   * Create audio track/channel
   */
  public createAudioTrack(config: AudioTrackConfig): void {
    if (!this.isInitialized) {
      throw DomainError.operationNotPermitted('createAudioTrack', 'Audio engine not initialized');
    }

    try {
      // Create audio player for this track
      const player = new Tone.Player().connect(this.masterChannel);
      
      // Create gain and pan nodes
      const gainNode = new Tone.Gain(config.volume);
      const panNode = new Tone.Panner(config.pan);
      
      // Create effects chain
      const effects = this.createEffectsChain(config.effects);
      
      // Connect audio chain: player -> effects -> gain -> pan -> master
      let currentNode = player;
      effects.forEach(effect => {
        currentNode = currentNode.connect(effect);
      });
      currentNode = currentNode.connect(gainNode).connect(panNode).connect(this.masterChannel);

      const channel: MixerChannel = {
        id: config.id,
        name: config.name,
        player,
        gainNode,
        panNode,
        effects,
        isMuted: config.muted,
        isSolo: config.solo
      };

      this.mixerChannels.set(config.id, channel);
      console.log(`Audio track created: ${config.name} (${config.id})`);

    } catch (error) {
      console.error('Error creating audio track:', error);
      throw DomainError.operationNotPermitted('createAudioTrack', `Failed to create track: ${error}`);
    }
  }

  /**
   * Create MIDI instrument track
   */
  public createMidiTrack(config: AudioTrackConfig, instrumentType: string = 'synth'): void {
    if (!this.isInitialized) {
      throw DomainError.operationNotPermitted('createMidiTrack', 'Audio engine not initialized');
    }

    try {
      // Create synthesizer based on type
      const synth = this.createSynthesizer(instrumentType);
      
      // Create gain and pan nodes
      const gainNode = new Tone.Gain(config.volume);
      const panNode = new Tone.Panner(config.pan);
      
      // Create effects chain
      const effects = this.createEffectsChain(config.effects);
      
      // Connect MIDI chain: synth -> effects -> gain -> pan -> master
      let currentNode = synth;
      effects.forEach(effect => {
        currentNode = currentNode.connect(effect);
      });
      currentNode = currentNode.connect(gainNode).connect(panNode).connect(this.masterChannel);

      const channel: MixerChannel = {
        id: config.id,
        name: config.name,
        synth,
        gainNode,
        panNode,
        effects,
        isMuted: config.muted,
        isSolo: config.solo
      };

      this.mixerChannels.set(config.id, channel);
      console.log(`MIDI track created: ${config.name} (${config.id}) with ${instrumentType}`);

    } catch (error) {
      console.error('Error creating MIDI track:', error);
      throw DomainError.operationNotPermitted('createMidiTrack', `Failed to create MIDI track: ${error}`);
    }
  }

  /**
   * Load audio sample
   */
  public async loadAudioSample(url: string, sampleId: string): Promise<void> {
    try {
      const buffer = new Tone.Buffer(url);
      await new Promise((resolve, reject) => {
        buffer.onload = resolve;
        buffer.onerror = reject;
      });
      
      this.loadedSamples.set(sampleId, buffer);
      console.log(`Audio sample loaded: ${sampleId} from ${url}`);

    } catch (error) {
      console.error('Error loading audio sample:', error);
      throw DomainError.operationNotPermitted('loadAudioSample', `Failed to load sample: ${error}`);
    }
  }

  /**
   * Schedule audio clip playback
   */
  public scheduleAudioClip(
    trackId: string,
    sampleId: string,
    startTime: string,
    duration?: string,
    options: {
      fadeIn?: string;
      fadeOut?: string;
      playbackRate?: number;
      loop?: boolean;
    } = {}
  ): void {
    const channel = this.mixerChannels.get(trackId);
    const sample = this.loadedSamples.get(sampleId);
    
    if (!channel || !sample) {
      throw DomainError.operationNotPermitted('scheduleAudioClip', 'Track or sample not found');
    }

    try {
      // Set the buffer for the player
      if (channel.player) {
        channel.player.buffer = sample;
        
        // Configure playback options
        if (options.playbackRate) {
          channel.player.playbackRate = options.playbackRate;
        }
        
        if (options.loop) {
          channel.player.loop = true;
        }

        // Schedule playback
        if (duration) {
          channel.player.start(startTime, 0, duration);
        } else {
          channel.player.start(startTime);
        }

        // Apply fade effects
        if (options.fadeIn) {
          channel.gainNode.gain.setValueAtTime(0, startTime);
          channel.gainNode.gain.linearRampToValueAtTime(channel.gainNode.gain.value, `${startTime} + ${options.fadeIn}`);
        }

        if (options.fadeOut && duration) {
          const fadeStartTime = `${startTime} + ${duration} - ${options.fadeOut}`;
          channel.gainNode.gain.setValueAtTime(channel.gainNode.gain.value, fadeStartTime);
          channel.gainNode.gain.linearRampToValueAtTime(0, `${startTime} + ${duration}`);
        }

        console.log(`Audio clip scheduled: ${sampleId} on track ${trackId} at ${startTime}`);
      }

    } catch (error) {
      console.error('Error scheduling audio clip:', error);
      throw DomainError.operationNotPermitted('scheduleAudioClip', `Failed to schedule clip: ${error}`);
    }
  }

  /**
   * Schedule MIDI notes
   */
  public scheduleMidiNotes(trackId: string, notes: MidiNote[], startTime: string): void {
    const channel = this.mixerChannels.get(trackId);
    
    if (!channel || !channel.synth) {
      throw DomainError.operationNotPermitted('scheduleMidiNotes', 'MIDI track not found');
    }

    try {
      notes.forEach(note => {
        const noteStartTime = `${startTime} + ${note.range.start}`;
        const noteDuration = note.range.length;
        const velocity = note.velocity / 127; // Normalize velocity
        
        // Convert MIDI note to frequency
        const frequency = Tone.Frequency(note.pitch, 'midi');
        
        // Schedule note
        channel.synth.triggerAttackRelease(frequency, noteDuration, noteStartTime, velocity);
      });

      console.log(`MIDI notes scheduled: ${notes.length} notes on track ${trackId} at ${startTime}`);

    } catch (error) {
      console.error('Error scheduling MIDI notes:', error);
      throw DomainError.operationNotPermitted('scheduleMidiNotes', `Failed to schedule MIDI notes: ${error}`);
    }
  }

  /**
   * Transport control - Start
   */
  public startTransport(): void {
    try {
      Tone.Transport.start();
      this.transportState.isPlaying = true;
      this.transportState.isPaused = false;
      this.eventCallbacks.onTransportStart?.();
      console.log('Transport started');

    } catch (error) {
      console.error('Error starting transport:', error);
      throw DomainError.operationNotPermitted('startTransport', `Failed to start transport: ${error}`);
    }
  }

  /**
   * Transport control - Stop
   */
  public stopTransport(): void {
    try {
      Tone.Transport.stop();
      this.transportState.isPlaying = false;
      this.transportState.isPaused = false;
      this.transportState.position = '0:0:0';
      this.eventCallbacks.onTransportStop?.();
      console.log('Transport stopped');

    } catch (error) {
      console.error('Error stopping transport:', error);
      throw DomainError.operationNotPermitted('stopTransport', `Failed to stop transport: ${error}`);
    }
  }

  /**
   * Transport control - Pause
   */
  public pauseTransport(): void {
    try {
      Tone.Transport.pause();
      this.transportState.isPlaying = false;
      this.transportState.isPaused = true;
      this.eventCallbacks.onTransportPause?.();
      console.log('Transport paused');

    } catch (error) {
      console.error('Error pausing transport:', error);
      throw DomainError.operationNotPermitted('pauseTransport', `Failed to pause transport: ${error}`);
    }
  }

  /**
   * Set BPM
   */
  public setBpm(bpm: number): void {
    if (bpm < 30 || bpm > 300) {
      throw DomainError.invalidBpm(bpm);
    }

    try {
      Tone.Transport.bpm.value = bpm;
      this.transportState.bpm = bpm;
      console.log(`BPM set to ${bpm}`);

    } catch (error) {
      console.error('Error setting BPM:', error);
      throw DomainError.operationNotPermitted('setBpm', `Failed to set BPM: ${error}`);
    }
  }

  /**
   * Set transport position
   */
  public setPosition(position: string): void {
    try {
      Tone.Transport.position = position;
      this.transportState.position = position;
      this.eventCallbacks.onPositionChange?.(position);
      console.log(`Position set to ${position}`);

    } catch (error) {
      console.error('Error setting position:', error);
      throw DomainError.operationNotPermitted('setPosition', `Failed to set position: ${error}`);
    }
  }

  /**
   * Set track volume
   */
  public setTrackVolume(trackId: string, volume: number): void {
    if (volume < 0 || volume > 1) {
      throw DomainError.invalidGain(volume);
    }

    const channel = this.mixerChannels.get(trackId);
    if (channel) {
      channel.gainNode.gain.value = volume;
      console.log(`Track ${trackId} volume set to ${volume}`);
    }
  }

  /**
   * Set track pan
   */
  public setTrackPan(trackId: string, pan: number): void {
    if (pan < -1 || pan > 1) {
      throw new Error('Pan value must be between -1 and 1');
    }

    const channel = this.mixerChannels.get(trackId);
    if (channel) {
      channel.panNode.pan.value = pan;
      console.log(`Track ${trackId} pan set to ${pan}`);
    }
  }

  /**
   * Mute/unmute track
   */
  public setTrackMute(trackId: string, muted: boolean): void {
    const channel = this.mixerChannels.get(trackId);
    if (channel) {
      channel.gainNode.mute = muted;
      channel.isMuted = muted;
      console.log(`Track ${trackId} ${muted ? 'muted' : 'unmuted'}`);
    }
  }

  /**
   * Solo track
   */
  public setTrackSolo(trackId: string, solo: boolean): void {
    const channel = this.mixerChannels.get(trackId);
    if (channel) {
      channel.isSolo = solo;
      
      // Handle solo logic - mute all other tracks when one is soloed
      if (solo) {
        this.mixerChannels.forEach((ch, id) => {
          if (id !== trackId) {
            ch.gainNode.mute = true;
          }
        });
      } else {
        // Check if any other tracks are soloed
        const hasSoloTracks = Array.from(this.mixerChannels.values()).some(ch => ch.isSolo);
        if (!hasSoloTracks) {
          // Restore original mute states
          this.mixerChannels.forEach(ch => {
            ch.gainNode.mute = ch.isMuted;
          });
        }
      }
      
      console.log(`Track ${trackId} solo ${solo ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * Add effect to track
   */
  public addTrackEffect(trackId: string, effectConfig: AudioEffectConfig): void {
    const channel = this.mixerChannels.get(trackId);
    if (!channel) {
      throw DomainError.operationNotPermitted('addTrackEffect', 'Track not found');
    }

    try {
      const effect = this.createEffect(effectConfig);
      
      // Insert effect into the chain
      // This is a simplified version - in practice, you'd need more sophisticated routing
      channel.effects.push(effect);
      
      console.log(`Effect ${effectConfig.type} added to track ${trackId}`);

    } catch (error) {
      console.error('Error adding track effect:', error);
      throw DomainError.operationNotPermitted('addTrackEffect', `Failed to add effect: ${error}`);
    }
  }

  /**
   * Set master volume
   */
  public setMasterVolume(volume: number): void {
    if (volume < 0 || volume > 1) {
      throw DomainError.invalidGain(volume);
    }

    if (this.masterChannel) {
      this.masterChannel.gain.value = volume;
      console.log(`Master volume set to ${volume}`);
    }
  }

  /**
   * Get transport state
   */
  public getTransportState(): TransportState {
    if (this.isInitialized) {
      this.transportState.position = Tone.Transport.position;
      this.transportState.bpm = Tone.Transport.bpm.value;
    }
    return { ...this.transportState };
  }

  /**
   * Set event callbacks
   */
  public setEventCallbacks(callbacks: Partial<typeof this.eventCallbacks>): void {
    this.eventCallbacks = { ...this.eventCallbacks, ...callbacks };
  }

  /**
   * Dispose of the audio engine
   */
  public async dispose(): Promise<void> {
    try {
      // Stop transport
      if (this.isInitialized) {
        Tone.Transport.stop();
        Tone.Transport.cancel();
      }

      // Dispose all channels
      this.mixerChannels.forEach(channel => {
        channel.player?.dispose();
        channel.synth?.dispose();
        channel.gainNode?.dispose();
        channel.panNode?.dispose();
        channel.effects.forEach(effect => effect.dispose());
      });

      // Dispose master effects
      this.masterEffects.forEach(effect => effect.dispose());

      // Dispose master channel
      this.masterChannel?.dispose();

      // Clear maps
      this.mixerChannels.clear();
      this.loadedSamples.clear();

      this.isInitialized = false;
      console.log('Tone.js Audio Engine disposed');

    } catch (error) {
      console.error('Error disposing audio engine:', error);
    }
  }

  // Private helper methods

  private setupMasterEffects(): void {
    // Add master compressor
    const compressor = new Tone.Compressor({
      threshold: -24,
      ratio: 8,
      attack: 0.003,
      release: 0.1
    });

    // Add master limiter
    const limiter = new Tone.Limiter(-3);

    // Connect master effects chain
    this.masterChannel.connect(compressor).connect(limiter).toDestination();
    this.masterEffects = [compressor, limiter];
  }

  private setupTransport(): void {
    // Set initial transport settings
    Tone.Transport.bpm.value = this.transportState.bpm;
    Tone.Transport.timeSignature = this.transportState.timeSignature;
    
    // Setup position tracking
    Tone.Transport.scheduleRepeat((time: number) => {
      this.transportState.position = Tone.Transport.position;
      this.eventCallbacks.onPositionChange?.(this.transportState.position);
    }, '16n');
  }

  private async setupDefaultInstruments(): Promise<void> {
    // This would setup default instrument presets
    // For now, we'll just log that it's ready
    console.log('Default instruments ready');
  }

  private createSynthesizer(type: string): any {
    switch (type) {
      case 'synth':
        return new Tone.Synth();
      case 'fmSynth':
        return new Tone.FMSynth();
      case 'amSynth':
        return new Tone.AMSynth();
      case 'polySynth':
        return new Tone.PolySynth();
      case 'monoSynth':
        return new Tone.MonoSynth();
      case 'membraneSynth':
        return new Tone.MembraneSynth();
      case 'metalSynth':
        return new Tone.MetalSynth();
      default:
        return new Tone.Synth();
    }
  }

  private createEffectsChain(effectConfigs: AudioEffectConfig[]): any[] {
    return effectConfigs.map(config => this.createEffect(config));
  }

  private createEffect(config: AudioEffectConfig): any {
    switch (config.type) {
      case 'reverb':
        return new Tone.Reverb(config.parameters);
      case 'delay':
        return new Tone.Delay(config.parameters);
      case 'chorus':
        return new Tone.Chorus(config.parameters);
      case 'distortion':
        return new Tone.Distortion(config.parameters);
      case 'filter':
        return new Tone.Filter(config.parameters);
      case 'compressor':
        return new Tone.Compressor(config.parameters);
      case 'eq':
        return new Tone.EQ3(config.parameters);
      default:
        throw new Error(`Unknown effect type: ${config.type}`);
    }
  }

  // Static utility methods

  /**
   * Check if Tone.js is available
   */
  public static isAvailable(): boolean {
    return typeof Tone !== 'undefined';
  }

  /**
   * Get Tone.js version
   */
  public static getVersion(): string {
    return typeof Tone !== 'undefined' ? Tone.version : 'Not available';
  }
} 