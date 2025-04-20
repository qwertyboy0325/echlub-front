export interface TimeSignature {
  numerator: number;
  denominator: number;
}

export class CreateMidiClipCommand {
  constructor(
    public readonly startTime: number,
    public readonly duration: number,
    public readonly timeSignature?: TimeSignature
  ) {
    if (startTime < 0) throw new Error('Start time cannot be negative');
    if (duration <= 0) throw new Error('Duration must be positive');
    if (timeSignature) {
      if (timeSignature.numerator <= 0) throw new Error('Time signature numerator must be positive');
      if (timeSignature.denominator <= 0) throw new Error('Time signature denominator must be positive');
    }
  }
} 