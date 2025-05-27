import { injectable, inject } from 'inversify';
import type { IntegrationEventBus } from '../../../../core/events/IntegrationEventBus';
import type { TrackRepository } from '../../domain/repositories/TrackRepository';
import { MusicArrangementTypes } from '../../di/MusicArrangementTypes';
import type { MidiNote } from '../../domain/entities/MidiNote';
import type { InstrumentRef } from '../../domain/value-objects/InstrumentRef';

/**
 * MIDI Adapter
 * Handles MIDI functionality and instrument management
 */
@injectable()
export class MidiAdapter {
  private isInitialized: boolean = false;
  private loadedInstruments: Map<string, any> = new Map();
  private midiInputs: Map<string, any> = new Map();
  private midiOutputs: Map<string, any> = new Map();

  constructor(
    @inject('IntegrationEventBus')
    private readonly integrationEventBus: IntegrationEventBus,
    @inject(MusicArrangementTypes.TrackRepository)
    private readonly trackRepository: TrackRepository
  ) {}

  /**
   * Initialize MIDI adapter
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('Initializing MIDI Adapter...');
      
      // Initialize Web MIDI API if available
      await this.initializeWebMIDI();
      
      // Setup default instruments
      await this.setupDefaultInstruments();
      
      this.setupEventSubscriptions();
      this.isInitialized = true;
      
      console.log('MIDI Adapter initialized successfully');
    } catch (error) {
      console.error('Failed to initialize MIDI Adapter:', error);
      throw error;
    }
  }

  /**
   * Initialize Web MIDI API
   */
  private async initializeWebMIDI(): Promise<void> {
    try {
      if (navigator.requestMIDIAccess) {
        const midiAccess = await navigator.requestMIDIAccess();
        
        // Setup MIDI inputs
        midiAccess.inputs.forEach((input, id) => {
          this.midiInputs.set(id, input);
          input.onmidimessage = this.handleMidiMessage.bind(this);
          console.log(`MIDI input connected: ${input.name}`);
        });
        
        // Setup MIDI outputs
        midiAccess.outputs.forEach((output, id) => {
          this.midiOutputs.set(id, output);
          console.log(`MIDI output connected: ${output.name}`);
        });
        
        // Listen for device changes
        midiAccess.onstatechange = this.handleMidiStateChange.bind(this);
      } else {
        console.warn('Web MIDI API not supported');
      }
    } catch (error) {
      console.error('Error initializing Web MIDI:', error);
    }
  }

  /**
   * Setup default instruments using Tone.js
   */
  private async setupDefaultInstruments(): Promise<void> {
    try {
      // Setup default Tone.js instruments
      const defaultInstruments = [
        { id: 'piano', name: 'Piano', type: 'Synth' },
        { id: 'bass', name: 'Bass', type: 'MonoSynth' },
        { id: 'lead', name: 'Lead', type: 'Synth' },
        { id: 'pad', name: 'Pad', type: 'PolySynth' }
      ];

      for (const instrument of defaultInstruments) {
        await this.loadInstrument(instrument.id, instrument);
      }
    } catch (error) {
      console.error('Error setting up default instruments:', error);
    }
  }

  /**
   * Setup event subscriptions
   */
  private setupEventSubscriptions(): void {
    this.integrationEventBus.subscribe(
      'midi.note-on',
      this.handleNoteOn.bind(this)
    );

    this.integrationEventBus.subscribe(
      'midi.note-off',
      this.handleNoteOff.bind(this)
    );

    this.integrationEventBus.subscribe(
      'midi.instrument-load',
      this.handleInstrumentLoad.bind(this)
    );
  }

  /**
   * Handle MIDI message from input device
   */
  private handleMidiMessage(event: any): void {
    const [status, note, velocity] = event.data;
    const command = status >> 4;
    const channel = status & 0xf;

    switch (command) {
      case 9: // Note on
        if (velocity > 0) {
          this.handleMidiNoteOn(note, velocity, channel);
        } else {
          this.handleMidiNoteOff(note, channel);
        }
        break;
      case 8: // Note off
        this.handleMidiNoteOff(note, channel);
        break;
      default:
        console.log(`Unhandled MIDI command: ${command}`);
    }
  }

  /**
   * Handle MIDI state change (device connect/disconnect)
   */
  private handleMidiStateChange(event: any): void {
    const port = event.port;
    
    if (port.state === 'connected') {
      if (port.type === 'input') {
        this.midiInputs.set(port.id, port);
        port.onmidimessage = this.handleMidiMessage.bind(this);
        console.log(`MIDI input connected: ${port.name}`);
      } else if (port.type === 'output') {
        this.midiOutputs.set(port.id, port);
        console.log(`MIDI output connected: ${port.name}`);
      }
    } else if (port.state === 'disconnected') {
      if (port.type === 'input') {
        this.midiInputs.delete(port.id);
        console.log(`MIDI input disconnected: ${port.name}`);
      } else if (port.type === 'output') {
        this.midiOutputs.delete(port.id);
        console.log(`MIDI output disconnected: ${port.name}`);
      }
    }
  }

  /**
   * Handle MIDI note on
   */
  private async handleMidiNoteOn(note: number, velocity: number, channel: number): Promise<void> {
    try {
      console.log(`MIDI Note On: ${note}, velocity: ${velocity}, channel: ${channel}`);
      
      // Publish integration event
      await this.integrationEventBus.publish({
        eventType: 'music-arrangement.midi-note-on',
        note,
        velocity,
        channel,
        timestamp: new Date().toISOString()
      } as any);
    } catch (error) {
      console.error('Error handling MIDI note on:', error);
    }
  }

  /**
   * Handle MIDI note off
   */
  private async handleMidiNoteOff(note: number, channel: number): Promise<void> {
    try {
      console.log(`MIDI Note Off: ${note}, channel: ${channel}`);
      
      // Publish integration event
      await this.integrationEventBus.publish({
        eventType: 'music-arrangement.midi-note-off',
        note,
        channel,
        timestamp: new Date().toISOString()
      } as any);
    } catch (error) {
      console.error('Error handling MIDI note off:', error);
    }
  }

  /**
   * Handle note on event
   */
  private async handleNoteOn(event: any): Promise<void> {
    try {
      const { instrumentId, note, velocity, time } = event;
      await this.playNote(instrumentId, note, velocity, time);
    } catch (error) {
      console.error('Error handling note on event:', error);
    }
  }

  /**
   * Handle note off event
   */
  private async handleNoteOff(event: any): Promise<void> {
    try {
      const { instrumentId, note, time } = event;
      await this.stopNote(instrumentId, note, time);
    } catch (error) {
      console.error('Error handling note off event:', error);
    }
  }

  /**
   * Handle instrument load event
   */
  private async handleInstrumentLoad(event: any): Promise<void> {
    try {
      const { instrumentId, instrumentConfig } = event;
      await this.loadInstrument(instrumentId, instrumentConfig);
    } catch (error) {
      console.error('Error handling instrument load event:', error);
    }
  }

  /**
   * Load instrument
   */
  public async loadInstrument(instrumentId: string, config: any): Promise<void> {
    try {
      console.log(`Loading instrument: ${instrumentId}`);
      
      // Create Tone.js instrument based on config
      // const instrument = new Tone[config.type]();
      // instrument.toDestination();
      
      // Store instrument reference
      this.loadedInstruments.set(instrumentId, config);
      
      console.log(`Instrument loaded: ${instrumentId}`);
    } catch (error) {
      console.error(`Error loading instrument ${instrumentId}:`, error);
      throw error;
    }
  }

  /**
   * Unload instrument
   */
  public unloadInstrument(instrumentId: string): void {
    try {
      const instrument = this.loadedInstruments.get(instrumentId);
      if (instrument) {
        // Dispose Tone.js instrument
        // instrument.dispose();
        
        this.loadedInstruments.delete(instrumentId);
        console.log(`Instrument unloaded: ${instrumentId}`);
      }
    } catch (error) {
      console.error(`Error unloading instrument ${instrumentId}:`, error);
    }
  }

  /**
   * Play note on instrument
   */
  public async playNote(instrumentId: string, note: number, velocity: number = 127, time?: number): Promise<void> {
    try {
      const instrument = this.loadedInstruments.get(instrumentId);
      if (!instrument) {
        throw new Error(`Instrument not loaded: ${instrumentId}`);
      }

      // Convert MIDI note to frequency
      const frequency = this.midiNoteToFrequency(note);
      const normalizedVelocity = velocity / 127;
      
      console.log(`Playing note ${note} (${frequency}Hz) on ${instrumentId}`);
      
      // Play note with Tone.js
      // instrument.triggerAttack(frequency, time, normalizedVelocity);
    } catch (error) {
      console.error(`Error playing note on ${instrumentId}:`, error);
      throw error;
    }
  }

  /**
   * Stop note on instrument
   */
  public async stopNote(instrumentId: string, note: number, time?: number): Promise<void> {
    try {
      const instrument = this.loadedInstruments.get(instrumentId);
      if (!instrument) {
        return; // Instrument not loaded, nothing to stop
      }

      const frequency = this.midiNoteToFrequency(note);
      
      console.log(`Stopping note ${note} (${frequency}Hz) on ${instrumentId}`);
      
      // Stop note with Tone.js
      // instrument.triggerRelease(frequency, time);
    } catch (error) {
      console.error(`Error stopping note on ${instrumentId}:`, error);
    }
  }

  /**
   * Schedule MIDI clip for playback
   */
  public async scheduleMidiClip(clipId: string, notes: MidiNote[], instrumentRef: InstrumentRef, startTime: number): Promise<void> {
    try {
      console.log(`Scheduling MIDI clip ${clipId} with ${notes.length} notes`);
      
      for (const note of notes) {
        const noteStartTime = startTime + note.startTime;
        const noteEndTime = noteStartTime + note.duration;
        
        // Schedule note on and off events
        await this.playNote(instrumentRef.instrumentId, note.pitch, note.velocity, noteStartTime);
        await this.stopNote(instrumentRef.instrumentId, note.pitch, noteEndTime);
      }
      
      // Publish integration event
      await this.integrationEventBus.publish({
        eventType: 'music-arrangement.midi-clip-scheduled',
        clipId,
        noteCount: notes.length,
        startTime,
        timestamp: new Date().toISOString()
      } as any);
    } catch (error) {
      console.error(`Error scheduling MIDI clip ${clipId}:`, error);
      throw error;
    }
  }

  /**
   * Convert MIDI note number to frequency
   */
  private midiNoteToFrequency(note: number): number {
    return 440 * Math.pow(2, (note - 69) / 12);
  }

  /**
   * Get loaded instruments
   */
  public getLoadedInstruments(): string[] {
    return Array.from(this.loadedInstruments.keys());
  }

  /**
   * Get MIDI input devices
   */
  public getMidiInputs(): string[] {
    return Array.from(this.midiInputs.keys());
  }

  /**
   * Get MIDI output devices
   */
  public getMidiOutputs(): string[] {
    return Array.from(this.midiOutputs.keys());
  }

  /**
   * Cleanup adapter
   */
  public dispose(): void {
    // Dispose all instruments
    for (const instrumentId of this.loadedInstruments.keys()) {
      this.unloadInstrument(instrumentId);
    }
    
    // Clear MIDI device references
    this.midiInputs.clear();
    this.midiOutputs.clear();
    
    this.isInitialized = false;
    console.log('MIDI Adapter disposed');
  }
} 