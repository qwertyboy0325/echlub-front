export class CreateAudioClipCommand {
  constructor(
    public readonly sampleId: string,
    public readonly startTime: number,
    public readonly duration: number,
    public readonly offset: number = 0
  ) {
    if (startTime < 0) throw new Error('Start time cannot be negative');
    if (duration <= 0) throw new Error('Duration must be positive');
    if (offset < 0) throw new Error('Offset cannot be negative');
  }
} 