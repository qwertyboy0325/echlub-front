export class TrackType {
  private constructor(private readonly value: 'audio' | 'instrument' | 'bus') {}

  static readonly AUDIO = new TrackType('audio');
  static readonly INSTRUMENT = new TrackType('instrument');
  static readonly BUS = new TrackType('bus');

  equals(other: TrackType): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  static fromString(value: string): TrackType {
    switch (value) {
      case 'audio':
        return TrackType.AUDIO;
      case 'instrument':
        return TrackType.INSTRUMENT;
      case 'bus':
        return TrackType.BUS;
      default:
        throw new Error(`Invalid track type: ${value}`);
    }
  }

  static isValid(value: string): boolean {
    return ['audio', 'instrument', 'bus'].includes(value);
  }
} 