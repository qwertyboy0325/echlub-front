export class CreateTrackCommand {
  constructor(
    public readonly name: string,
    public readonly type: 'audio' | 'instrument' | 'bus'
  ) {}
} 