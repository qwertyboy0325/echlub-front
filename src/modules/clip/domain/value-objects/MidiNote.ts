export class MidiNote {
  constructor(
    private readonly pitch: number,
    private readonly startTime: number,
    private readonly duration: number,
    private readonly velocity: number
  ) {
    if (pitch < 0 || pitch > 127) {
      throw new Error('MIDI pitch must be between 0 and 127');
    }
    if (velocity < 0 || velocity > 127) {
      throw new Error('MIDI velocity must be between 0 and 127');
    }
    if (duration < 0) {
      throw new Error('Duration cannot be negative');
    }
    if (startTime < 0) {
      throw new Error('Start time cannot be negative');
    }
  }

  getPitch(): number {
    return this.pitch;
  }

  getStartTime(): number {
    return this.startTime;
  }

  getDuration(): number {
    return this.duration;
  }

  getVelocity(): number {
    return this.velocity;
  }

  equals(other: MidiNote): boolean {
    return this.pitch === other.pitch &&
      this.startTime === other.startTime &&
      this.duration === other.duration &&
      this.velocity === other.velocity;
  }

  toJSON(): object {
    return {
      pitch: this.pitch,
      startTime: this.startTime,
      duration: this.duration,
      velocity: this.velocity
    };
  }
} 