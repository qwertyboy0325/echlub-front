import { DomainEvent } from '../../../../../core/events/DomainEvent';

/**
 * Jam Clock Tick Integration Event
 * Received from JamSession BC for playback synchronization
 */
export class JamClockTickEvent extends DomainEvent {
  constructor(
    public readonly positionSeconds: number,
    public readonly bpm: number,
    public readonly isPlaying: boolean = true
  ) {
    super('jam.clock-tick');
  }

  public get eventData() {
    return {
      positionSeconds: this.positionSeconds,
      bpm: this.bpm,
      isPlaying: this.isPlaying,
      timestamp: this.occurredOn.toISOString()
    };
  }
} 