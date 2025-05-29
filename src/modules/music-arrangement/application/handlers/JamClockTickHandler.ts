import { injectable } from 'inversify';
import { JamClockTickEvent } from '../../domain/events/integration/JamClockTickEvent';

// Placeholder for audio context - should be imported from audio infrastructure
interface AudioContext {
  currentTime: number;
  suspend(): Promise<void>;
  resume(): Promise<void>;
}

/**
 * Jam Clock Tick Event Handler
 * Handles playback synchronization from JamSession BC
 */
@injectable()
export class JamClockTickHandler {
  private currentPosition: number = 0;
  private currentBpm: number = 120;
  private isPlaying: boolean = false;

  constructor(
    private audioContext?: AudioContext
  ) {}

  async handle(event: JamClockTickEvent): Promise<void> {
    try {
      this.currentPosition = event.positionSeconds;
      this.currentBpm = event.bpm;
      
      if (event.isPlaying !== this.isPlaying) {
        this.isPlaying = event.isPlaying;
        
        if (this.audioContext) {
          if (this.isPlaying) {
            await this.audioContext.resume();
          } else {
            await this.audioContext.suspend();
          }
        }
      }

      // Notify any registered playback listeners
      this.notifyPlaybackListeners(event);
      
    } catch (error) {
      console.error('Error handling jam clock tick:', error);
    }
  }

  private notifyPlaybackListeners(event: JamClockTickEvent): void {
    // TODO: Implement listener notification system
    // This would notify audio/MIDI adapters about playback state changes
    console.log(`Playback sync: ${event.positionSeconds}s @ ${event.bpm} BPM`);
  }

  // Getters for current playback state
  public get position(): number {
    return this.currentPosition;
  }

  public get bpm(): number {
    return this.currentBpm;
  }

  public get playing(): boolean {
    return this.isPlaying;
  }
} 