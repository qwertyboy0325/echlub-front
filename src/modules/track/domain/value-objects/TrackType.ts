export class TrackType {
  static readonly AUDIO = new TrackType('audio');
  static readonly INSTRUMENT = new TrackType('instrument');
  static readonly BUS = new TrackType('bus');

  private constructor(private readonly value: string) {}

  static fromString(value: string): TrackType {
    switch (value) {
      case 'audio': return TrackType.AUDIO;
      case 'instrument': return TrackType.INSTRUMENT;
      case 'bus': return TrackType.BUS;
      default: throw new Error(`Invalid track type: ${value}`);
    }
  }

  static values(): TrackType[] {
    return [TrackType.AUDIO, TrackType.INSTRUMENT, TrackType.BUS];
  }

  toString(): string {
    return this.value;
  }

  equals(other: TrackType): boolean {
    return this.value === other.value;
  }

  static isValid(value: string): boolean {
    return ['audio', 'instrument', 'bus'].includes(value);
  }
} 
