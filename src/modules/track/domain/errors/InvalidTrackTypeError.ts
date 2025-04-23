import { TrackError } from './TrackError';

export class InvalidTrackTypeError extends TrackError {
  constructor(type: string) {
    super(
      `Invalid track type: ${type}`,
      'INVALID_TRACK_TYPE',
      { type }
    );
    this.name = 'InvalidTrackTypeError';
  }
} 