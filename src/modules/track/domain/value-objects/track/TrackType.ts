import { InvalidTrackTypeError } from '../../errors/InvalidTrackTypeError';

export class TrackType {
  static readonly AUDIO = new TrackType('audio');
  static readonly MIDI = new TrackType('midi');
  static readonly BUS = new TrackType('bus');

  private constructor(private readonly value: string) {}

  static fromString(value: string): TrackType {
    if (value === null || value === undefined) {
      throw new InvalidTrackTypeError('Track type cannot be null');
    }
    if (!value) {
      throw new InvalidTrackTypeError(value);
    }
    switch (value.toLowerCase()) {
      case 'audio':
        return TrackType.AUDIO;
      case 'midi':
        return TrackType.MIDI;
      case 'bus':
        return TrackType.BUS;
      default:
        throw new InvalidTrackTypeError(value);
    }
  }

  static values(): TrackType[] {
    return [TrackType.AUDIO, TrackType.MIDI, TrackType.BUS];
  }

  toString(): string {
    return this.value;
  }

  equals(other: TrackType): boolean {
    if (!(other instanceof TrackType)) {
      return false;
    }
    return this.value === other.value;
  }

  static isValid(value: string): boolean {
    if (!value) return false;
    return ['audio', 'midi', 'bus'].includes(value.toLowerCase());
  }

  toJSON(): string {
    return this.value;
  }
} 