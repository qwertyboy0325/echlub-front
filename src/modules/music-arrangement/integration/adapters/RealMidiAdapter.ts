import { DomainError } from '../../domain/errors/DomainError';
import { MidiNote } from '../../domain/entities/MidiNote';
import { MidiClip } from '../../domain/entities/MidiClip';
import { InstrumentRef } from '../../domain/value-objects/InstrumentRef';

/**
 * MIDI Device Info
 */
export interface MidiDeviceInfo {
  id: string;
  name: string;
  manufacturer: string;
  type: 'input' | 'output';
  state: 'connected' | 'disconnected';
}

/**
 * Synthesizer Configuration
 */
export interface SynthConfig {
  type: 'oscillator' | 'sample' | 'fm';
  waveform?: OscillatorType;
  attack?: number;
  decay?: number;
  sustain?: number;
  release?: number;
  filterFreq?: number;
  filterQ?: number;
}

/**
 * MIDI Event
 */
export interface MidiEvent {
  type: 'noteOn' | 'noteOff' | 'controlChange' | 'programChange';
  channel: number;
  note?: number;
  velocity?: number;
  controller?: number;
  value?: number;
  program?: number;
  timestamp: number;
}

/**
 * Instrument Instance
 */
export interface InstrumentInstance {
  id: string;
  name: string;
  config: SynthConfig;
  gainNode: GainNode;
  activeNotes: Map<number, OscillatorNode>;
  effects: AudioNode[];
}

/**
 * MIDI Engine Events
 */
export interface MidiEngineEvents {
  onNoteOn: (note: number, velocity: number, channel: number) => void;
  onNoteOff: (note: number, channel: number) => void;
  onControlChange: (controller: number, value: number, channel: number) => void;
  onDeviceConnected: (device: MidiDeviceInfo) => void;
  onDeviceDisconnected: (device: MidiDeviceInfo) => void;
  onError: (error: Error) => void;
}

/**
 * Real MIDI Adapter
 * Provides actual MIDI functionality using Web MIDI API and Web Audio API
 * Supports MIDI I/O, synthesis, and real-time performance
 */
export class RealMidiAdapter {
  private audioContext: AudioContext | null = null;
  private midiAccess: MIDIAccess | null = null;
  private masterGainNode: GainNode | null = null;
  
  private instruments: Map<string, InstrumentInstance> = new Map();
  private midiInputs: Map<string, MIDIInput> = new Map();
  private midiOutputs: Map<string, MIDIOutput> = new Map();
  private scheduledNotes: Map<string, number> = new Map();
  
  private isInitialized: boolean = false;
  private events: Partial<MidiEngineEvents> = {};

  /**
   * Initialize the MIDI adapter
   */
  public async initialize(audioContext?: AudioContext): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initialize audio context for synthesis if not provided
      if (!audioContext) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) {
          throw new Error('Web Audio API is not supported in this browser');
        }
        this.audioContext = new AudioContextClass();
      } else {
        this.audioContext = audioContext;
      }
      
      // Create master gain node
      this.masterGainNode = this.audioContext.createGain();
      this.masterGainNode.connect(this.audioContext.destination);
      this.masterGainNode.gain.value = 0.7; // Default volume

      // Initialize Web MIDI API
      await this.initializeWebMIDI();
      
      // Setup default instruments
      await this.setupDefaultInstruments();

      this.isInitialized = true;
      console.log('Real MIDI Adapter initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize Real MIDI Adapter:', error);
      throw DomainError.operationNotPermitted('initialize', 'MIDI adapter initialization failed');
    }
  }

  /**
   * Initialize Web MIDI API
   */
  private async initializeWebMIDI(): Promise<void> {
    if (!navigator.requestMIDIAccess) {
      console.warn('Web MIDI API not supported');
      return;
    }

    try {
      this.midiAccess = await navigator.requestMIDIAccess({ sysex: false });
      
      // Setup existing devices
      this.midiAccess.inputs.forEach((input) => {
        this.connectMidiInput(input);
      });
      
      this.midiAccess.outputs.forEach((output) => {
        this.connectMidiOutput(output);
      });
      
      // Listen for device changes
      this.midiAccess.onstatechange = this.handleMidiStateChange.bind(this);
      
      console.log(`MIDI initialized: ${this.midiInputs.size} inputs, ${this.midiOutputs.size} outputs`);
      
    } catch (error) {
      console.error('Error initializing Web MIDI:', error);
      throw error;
    }
  }

  /**
   * Setup default instruments
   */
  private async setupDefaultInstruments(): Promise<void> {
    if (!this.audioContext || !this.masterGainNode) return;

    const defaultInstruments = [
      {
        id: 'piano',
        name: 'Piano',
        config: {
          type: 'oscillator' as const,
          waveform: 'sine' as OscillatorType,
          attack: 0.01,
          decay: 0.3,
          sustain: 0.3,
          release: 1.0
        }
      },
      {
        id: 'bass',
        name: 'Bass',
        config: {
          type: 'oscillator' as const,
          waveform: 'sawtooth' as OscillatorType,
          attack: 0.01,
          decay: 0.1,
          sustain: 0.8,
          release: 0.5
        }
      },
      {
        id: 'lead',
        name: 'Lead',
        config: {
          type: 'oscillator' as const,
          waveform: 'square' as OscillatorType,
          attack: 0.05,
          decay: 0.2,
          sustain: 0.6,
          release: 0.8
        }
      },
      {
        id: 'pad',
        name: 'Pad',
        config: {
          type: 'oscillator' as const,
          waveform: 'triangle' as OscillatorType,
          attack: 0.5,
          decay: 0.3,
          sustain: 0.7,
          release: 2.0
        }
      }
    ];

    for (const instrument of defaultInstruments) {
      await this.loadInstrument(instrument.id, instrument.name, instrument.config);
    }
  }

  /**
   * Load instrument
   */
  public async loadInstrument(id: string, name: string, config: SynthConfig): Promise<void> {
    if (!this.audioContext || !this.masterGainNode) {
      throw DomainError.operationNotPermitted('loadInstrument', 'MIDI adapter not initialized');
    }

    try {
      // Create gain node for this instrument
      const gainNode = this.audioContext.createGain();
      gainNode.connect(this.masterGainNode);
      gainNode.gain.value = 0.8;

      const instrument: InstrumentInstance = {
        id,
        name,
        config,
        gainNode,
        activeNotes: new Map(),
        effects: []
      };

      this.instruments.set(id, instrument);
      console.log(`Instrument loaded: ${name} (${id})`);
      
    } catch (error) {
      console.error('Error loading instrument:', error);
      throw DomainError.operationNotPermitted('loadInstrument', `Failed to load instrument: ${error}`);
    }
  }

  /**
   * Play MIDI note
   */
  public async playNote(
    instrumentId: string,
    note: number,
    velocity: number = 127,
    duration?: number
  ): Promise<void> {
    const instrument = this.instruments.get(instrumentId);
    if (!instrument || !this.audioContext) {
      throw DomainError.operationNotPermitted('playNote', 'Instrument not found or adapter not initialized');
    }

    try {
      // Stop existing note if playing
      this.stopNote(instrumentId, note);

      // Create oscillator
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      // Configure oscillator
      oscillator.type = instrument.config.waveform || 'sine';
      oscillator.frequency.value = this.midiNoteToFrequency(note);
      
      // Configure ADSR envelope
      const now = this.audioContext.currentTime;
      const velocityGain = (velocity / 127) * 0.3; // Scale velocity
      
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(velocityGain, now + (instrument.config.attack || 0.01));
      gainNode.gain.linearRampToValueAtTime(
        velocityGain * (instrument.config.sustain || 0.3),
        now + (instrument.config.attack || 0.01) + (instrument.config.decay || 0.1)
      );

      // Connect nodes
      oscillator.connect(gainNode);
      gainNode.connect(instrument.gainNode);

      // Start oscillator
      oscillator.start(now);
      
      // Store active note
      instrument.activeNotes.set(note, oscillator);

      // Auto-stop if duration specified
      if (duration) {
        setTimeout(() => {
          this.stopNote(instrumentId, note);
        }, duration * 1000);
      }

      console.log(`Note played: ${note} on ${instrumentId}, velocity: ${velocity}`);
      
    } catch (error) {
      console.error('Error playing note:', error);
      throw DomainError.operationNotPermitted('playNote', `Failed to play note: ${error}`);
    }
  }

  /**
   * Stop MIDI note
   */
  public stopNote(instrumentId: string, note: number): void {
    const instrument = this.instruments.get(instrumentId);
    if (!instrument || !this.audioContext) return;

    const oscillator = instrument.activeNotes.get(note);
    if (oscillator) {
      try {
        // Apply release envelope
        const now = this.audioContext.currentTime;
        const releaseTime = instrument.config.release || 0.5;
        
        // Get current gain value and ramp to zero
        const gainNode = oscillator.context.createGain();
        gainNode.gain.setValueAtTime(gainNode.gain.value, now);
        gainNode.gain.linearRampToValueAtTime(0, now + releaseTime);
        
        // Stop oscillator after release
        oscillator.stop(now + releaseTime);
        
        instrument.activeNotes.delete(note);
        console.log(`Note stopped: ${note} on ${instrumentId}`);
        
      } catch (error) {
        console.warn(`Could not stop note ${note} on ${instrumentId}:`, error);
        instrument.activeNotes.delete(note);
      }
    }
  }

  /**
   * Schedule MIDI clip playback
   */
  public async scheduleMidiClip(
    clipId: string,
    notes: MidiNote[],
    instrumentId: string,
    startTime: number
  ): Promise<void> {
    if (!this.instruments.has(instrumentId)) {
      throw DomainError.operationNotPermitted('scheduleMidiClip', 'Instrument not found');
    }

    try {
      for (const note of notes) {
        const noteStartTime = startTime + note.range.start;
        const noteDuration = note.range.length;
        
        // Schedule note on
        const noteOnTimeout = setTimeout(() => {
          this.playNote(instrumentId, note.pitch, note.velocity, noteDuration);
        }, noteStartTime * 1000);
        
        this.scheduledNotes.set(`${clipId}-${note.noteId.toString()}-on`, noteOnTimeout);
      }
      
      console.log(`MIDI clip scheduled: ${clipId} with ${notes.length} notes`);
      
    } catch (error) {
      console.error('Error scheduling MIDI clip:', error);
      throw DomainError.operationNotPermitted('scheduleMidiClip', `Failed to schedule clip: ${error}`);
    }
  }

  /**
   * Unschedule MIDI clip
   */
  public unscheduleMidiClip(clipId: string): void {
    // Clear all scheduled notes for this clip
    for (const [key, timeout] of this.scheduledNotes) {
      if (key.startsWith(clipId)) {
        clearTimeout(timeout);
        this.scheduledNotes.delete(key);
      }
    }
    
    console.log(`MIDI clip unscheduled: ${clipId}`);
  }

  /**
   * Send MIDI message to output device
   */
  public sendMidiMessage(deviceId: string, message: number[]): void {
    const output = this.midiOutputs.get(deviceId);
    if (output) {
      output.send(message);
      console.log(`MIDI message sent to ${deviceId}:`, message);
    } else {
      console.warn(`MIDI output device not found: ${deviceId}`);
    }
  }

  /**
   * Get available MIDI devices
   */
  public getMidiDevices(): MidiDeviceInfo[] {
    const devices: MidiDeviceInfo[] = [];
    
    this.midiInputs.forEach((input) => {
      devices.push({
        id: input.id,
        name: input.name || 'Unknown Input',
        manufacturer: input.manufacturer || 'Unknown',
        type: 'input',
        state: input.state
      });
    });
    
    this.midiOutputs.forEach((output) => {
      devices.push({
        id: output.id,
        name: output.name || 'Unknown Output',
        manufacturer: output.manufacturer || 'Unknown',
        type: 'output',
        state: output.state
      });
    });
    
    return devices;
  }

  /**
   * Get loaded instruments
   */
  public getInstruments(): { id: string; name: string }[] {
    return Array.from(this.instruments.values()).map(inst => ({
      id: inst.id,
      name: inst.name
    }));
  }

  /**
   * Set instrument volume
   */
  public setInstrumentVolume(instrumentId: string, volume: number): void {
    const instrument = this.instruments.get(instrumentId);
    if (instrument) {
      if (volume < 0 || volume > 1) {
        throw DomainError.invalidGain(volume);
      }
      instrument.gainNode.gain.value = volume;
      console.log(`Instrument ${instrumentId} volume set to ${volume}`);
    }
  }

  /**
   * Set master volume
   */
  public setMasterVolume(volume: number): void {
    if (volume < 0 || volume > 1) {
      throw DomainError.invalidGain(volume);
    }
    
    if (this.masterGainNode) {
      this.masterGainNode.gain.value = volume;
      console.log(`Master MIDI volume set to ${volume}`);
    }
  }

  /**
   * Set event handlers
   */
  public setEventHandlers(events: Partial<MidiEngineEvents>): void {
    this.events = { ...this.events, ...events };
  }

  /**
   * Dispose of the MIDI adapter
   */
  public async dispose(): Promise<void> {
    try {
      // Clear scheduled notes
      this.scheduledNotes.forEach(timeout => clearTimeout(timeout));
      this.scheduledNotes.clear();
      
      // Stop all active notes
      this.instruments.forEach(instrument => {
        instrument.activeNotes.forEach((oscillator, note) => {
          try {
            oscillator.stop();
          } catch (error) {
            console.warn(`Could not stop oscillator for note ${note}:`, error);
          }
        });
        instrument.activeNotes.clear();
      });
      
      // Clear instruments
      this.instruments.clear();
      
      // Disconnect MIDI devices
      this.midiInputs.forEach(input => {
        input.onmidimessage = null;
      });
      this.midiInputs.clear();
      this.midiOutputs.clear();
      
      this.masterGainNode = null;
      this.audioContext = null;
      this.midiAccess = null;
      this.isInitialized = false;
      
      console.log('Real MIDI Adapter disposed');
      
    } catch (error) {
      console.error('Error disposing MIDI adapter:', error);
    }
  }

  // Private helper methods

  private connectMidiInput(input: MIDIInput): void {
    this.midiInputs.set(input.id, input);
    input.onmidimessage = this.handleMidiMessage.bind(this);
    
    const deviceInfo: MidiDeviceInfo = {
      id: input.id,
      name: input.name || 'Unknown Input',
      manufacturer: input.manufacturer || 'Unknown',
      type: 'input',
      state: input.state
    };
    
    this.events.onDeviceConnected?.(deviceInfo);
    console.log(`MIDI input connected: ${deviceInfo.name}`);
  }

  private connectMidiOutput(output: MIDIOutput): void {
    this.midiOutputs.set(output.id, output);
    
    const deviceInfo: MidiDeviceInfo = {
      id: output.id,
      name: output.name || 'Unknown Output',
      manufacturer: output.manufacturer || 'Unknown',
      type: 'output',
      state: output.state
    };
    
    this.events.onDeviceConnected?.(deviceInfo);
    console.log(`MIDI output connected: ${deviceInfo.name}`);
  }

  private handleMidiStateChange(event: MIDIConnectionEvent): void {
    const port = event.port;
    
    if (!port) {
      console.warn('MIDI state change event received with null port');
      return;
    }
    
    if (port.state === 'connected') {
      if (port.type === 'input') {
        this.connectMidiInput(port as MIDIInput);
      } else if (port.type === 'output') {
        this.connectMidiOutput(port as MIDIOutput);
      }
    } else if (port.state === 'disconnected') {
      const deviceInfo: MidiDeviceInfo = {
        id: port.id,
        name: port.name || 'Unknown',
        manufacturer: port.manufacturer || 'Unknown',
        type: port.type as 'input' | 'output',
        state: port.state
      };
      
      if (port.type === 'input') {
        this.midiInputs.delete(port.id);
      } else if (port.type === 'output') {
        this.midiOutputs.delete(port.id);
      }
      
      this.events.onDeviceDisconnected?.(deviceInfo);
      console.log(`MIDI device disconnected: ${deviceInfo.name}`);
    }
  }

  private handleMidiMessage(event: MIDIMessageEvent): void {
    if (!event.data || event.data.length < 1) {
      console.warn('Invalid MIDI message received');
      return;
    }

    const data = Array.from(event.data);
    const [status, data1, data2] = data;
    const command = status >> 4;
    const channel = status & 0xf;

    try {
      switch (command) {
        case 9: // Note on
          if (data2 > 0) {
            this.events.onNoteOn?.(data1, data2, channel);
          } else {
            this.events.onNoteOff?.(data1, channel);
          }
          break;
        case 8: // Note off
          this.events.onNoteOff?.(data1, channel);
          break;
        case 11: // Control change
          this.events.onControlChange?.(data1, data2, channel);
          break;
        default:
          console.log(`Unhandled MIDI command: ${command}`);
      }
    } catch (error) {
      this.events.onError?.(error as Error);
    }
  }

  private midiNoteToFrequency(note: number): number {
    return 440 * Math.pow(2, (note - 69) / 12);
  }

  // Static utility methods

  /**
   * Check if Web MIDI API is supported
   */
  public static isSupported(): boolean {
    return !!navigator.requestMIDIAccess;
  }

  /**
   * Convert note name to MIDI number
   */
  public static noteNameToMidi(noteName: string): number {
    const noteMap: { [key: string]: number } = {
      'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
      'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
      'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
    };
    
    const match = noteName.match(/^([A-G][#b]?)(\d+)$/);
    if (!match) {
      throw new Error(`Invalid note name: ${noteName}`);
    }
    
    const [, note, octave] = match;
    return noteMap[note] + (parseInt(octave) + 1) * 12;
  }

  /**
   * Convert MIDI number to note name
   */
  public static midiToNoteName(midiNote: number): string {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midiNote / 12) - 1;
    const note = noteNames[midiNote % 12];
    return `${note}${octave}`;
  }
} 