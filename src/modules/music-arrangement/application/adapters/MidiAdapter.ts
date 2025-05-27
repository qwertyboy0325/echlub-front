import { injectable } from 'inversify';
import { MidiClip } from '../../domain/entities/MidiClip';
import { MidiNote } from '../../domain/entities/MidiNote';
import { InstrumentRef } from '../../domain/value-objects/InstrumentRef';

// Placeholder for Tone.js MIDI - should be imported from audio infrastructure
interface ToneSynth {
  triggerAttackRelease(note: string, duration: number, time?: number, velocity?: number): void;
  volume: { value: number };
  dispose(): void;
}

interface ToneSampler {
  triggerAttackRelease(note: string, duration: number, time?: number, velocity?: number): void;
  volume: { value: number };
  dispose(): void;
}

/**
 * MIDI Adapter
 * Integrates with Tone.js for MIDI playback and synthesis
 */
@injectable()
export class MidiAdapter {
  private instruments: Map<string, ToneSynth | ToneSampler> = new Map();
  private scheduledNotes: Map<string, any[]> = new Map(); // Store scheduled note events

  constructor() {
    // TODO: Initialize default instruments
  }

  /**
   * Load instrument for MIDI clip
   */
  async loadInstrument(instrumentRef: InstrumentRef): Promise<void> {
    try {
      const instrumentId = instrumentRef.instrumentId;
      
      if (this.instruments.has(instrumentId)) {
        return; // Already loaded
      }

      let instrument: ToneSynth | ToneSampler;

      switch (instrumentRef.type) {
        case 'synth':
          instrument = this.createSynth(instrumentRef);
          break;
        case 'sampler':
          instrument = await this.createSampler(instrumentRef);
          break;
        case 'plugin':
          instrument = await this.createPlugin(instrumentRef);
          break;
        default:
          throw new Error(`Unsupported instrument type: ${instrumentRef.type}`);
      }

      this.instruments.set(instrumentId, instrument);
      
    } catch (error) {
      console.error(`Failed to load instrument ${instrumentRef.instrumentId}:`, error);
      throw error;
    }
  }

  /**
   * Schedule MIDI clip for playback
   */
  scheduleMidiClip(clip: MidiClip, startTime: number): void {
    try {
      const instrument = this.instruments.get(clip.instrumentId);
      if (!instrument) {
        console.warn(`Instrument not loaded for clip ${clip.clipId.toString()}`);
        return;
      }

      const scheduledEvents: any[] = [];
      const clipId = clip.clipId.toString();

      // Schedule each MIDI note
      for (const note of clip.notes) {
        const noteStartTime = startTime + note.startTime;
        const noteDuration = note.duration;
        const noteName = note.noteName;
        const velocity = note.velocity / 127; // Normalize to 0-1

        // Schedule note attack and release
        const noteEvent = this.scheduleNote(
          instrument,
          noteName,
          noteDuration,
          noteStartTime,
          velocity
        );

        scheduledEvents.push(noteEvent);
      }

      // Store scheduled events for potential cancellation
      this.scheduledNotes.set(clipId, scheduledEvents);
      
    } catch (error) {
      console.error(`Failed to schedule MIDI clip ${clip.clipId.toString()}:`, error);
    }
  }

  /**
   * Stop MIDI clip playback
   */
  stopMidiClip(clipId: string): void {
    const scheduledEvents = this.scheduledNotes.get(clipId);
    if (!scheduledEvents) {
      return;
    }

    // Cancel all scheduled events for this clip
    for (const event of scheduledEvents) {
      this.cancelScheduledEvent(event);
    }

    this.scheduledNotes.delete(clipId);
  }

  /**
   * Play single MIDI note immediately
   */
  playNote(
    instrumentId: string,
    pitch: number,
    velocity: number,
    duration: number,
    startTime?: number
  ): void {
    const instrument = this.instruments.get(instrumentId);
    if (!instrument) {
      console.warn(`Instrument not found: ${instrumentId}`);
      return;
    }

    const noteName = this.pitchToNoteName(pitch);
    const normalizedVelocity = velocity / 127;

    this.scheduleNote(instrument, noteName, duration, startTime, normalizedVelocity);
  }

  /**
   * Update instrument volume
   */
  setInstrumentVolume(instrumentId: string, volume: number): void {
    const instrument = this.instruments.get(instrumentId);
    if (instrument) {
      instrument.volume.value = this.gainToDecibels(volume);
    }
  }

  /**
   * Unload instrument and free resources
   */
  unloadInstrument(instrumentId: string): void {
    const instrument = this.instruments.get(instrumentId);
    if (instrument) {
      instrument.dispose();
      this.instruments.delete(instrumentId);
    }

    // Cancel any scheduled notes for this instrument
    for (const [clipId, events] of this.scheduledNotes) {
      // TODO: Check if events belong to this instrument
      // This would require storing instrument ID with each event
    }
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    // Cancel all scheduled notes
    for (const events of this.scheduledNotes.values()) {
      for (const event of events) {
        this.cancelScheduledEvent(event);
      }
    }
    this.scheduledNotes.clear();

    // Dispose all instruments
    for (const instrument of this.instruments.values()) {
      instrument.dispose();
    }
    this.instruments.clear();
  }

  // Helper methods
  private createSynth(instrumentRef: InstrumentRef): ToneSynth {
    // TODO: Create actual Tone.js Synth with parameters
    // const synth = new Tone.Synth(instrumentRef.parameters);
    
    // Placeholder implementation
    return {
      triggerAttackRelease: (note: string, duration: number, time?: number, velocity?: number) => {
        console.log(`Synth playing ${note} for ${duration}s at ${time} with velocity ${velocity}`);
      },
      volume: { value: 0 },
      dispose: () => { console.log('Disposing synth'); }
    };
  }

  private async createSampler(instrumentRef: InstrumentRef): Promise<ToneSampler> {
    // TODO: Create actual Tone.js Sampler with sample URLs
    // const sampler = new Tone.Sampler(sampleUrls);
    // await sampler.loaded;
    
    // Placeholder implementation
    return {
      triggerAttackRelease: (note: string, duration: number, time?: number, velocity?: number) => {
        console.log(`Sampler playing ${note} for ${duration}s at ${time} with velocity ${velocity}`);
      },
      volume: { value: 0 },
      dispose: () => { console.log('Disposing sampler'); }
    };
  }

  private async createPlugin(instrumentRef: InstrumentRef): Promise<ToneSynth> {
    // TODO: Load external plugin/VST
    // This would require additional plugin loading infrastructure
    
    // Placeholder implementation - fallback to synth
    return this.createSynth(instrumentRef);
  }

  private scheduleNote(
    instrument: ToneSynth | ToneSampler,
    noteName: string,
    duration: number,
    startTime?: number,
    velocity?: number
  ): any {
    // TODO: Use actual Tone.js scheduling
    // return Tone.Transport.schedule((time) => {
    //   instrument.triggerAttackRelease(noteName, duration, time, velocity);
    // }, startTime);
    
    // Placeholder implementation
    const event = {
      instrument,
      noteName,
      duration,
      startTime,
      velocity,
      id: Math.random().toString(36)
    };
    
    console.log(`Scheduled note: ${noteName} at ${startTime}`);
    return event;
  }

  private cancelScheduledEvent(event: any): void {
    // TODO: Cancel actual Tone.js scheduled event
    // Tone.Transport.cancel(event);
    
    console.log(`Cancelled scheduled note: ${event.noteName}`);
  }

  private pitchToNoteName(pitch: number): string {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(pitch / 12) - 1;
    const note = noteNames[pitch % 12];
    return `${note}${octave}`;
  }

  private gainToDecibels(gain: number): number {
    return gain > 0 ? 20 * Math.log10(gain) : -Infinity;
  }
} 