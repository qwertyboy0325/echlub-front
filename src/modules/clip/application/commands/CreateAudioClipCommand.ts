export class CreateAudioClipCommand {
  constructor(
    public readonly sampleId: string,
    public readonly startTime: number,
    public readonly duration: number,
    public readonly offset: number
  ) {}
} 