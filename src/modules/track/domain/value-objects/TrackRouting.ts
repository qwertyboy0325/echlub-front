import { TrackId } from './TrackId';

export class TrackRouting {
  constructor(
    private readonly inputTrackId: TrackId | null,
    private readonly outputTrackId: TrackId | null
  ) {}

  getInputTrackId(): TrackId | null {
    return this.inputTrackId;
  }

  getOutputTrackId(): TrackId | null {
    return this.outputTrackId;
  }

  equals(other: TrackRouting): boolean {
    if (this.inputTrackId === null && other.inputTrackId === null) {
      return this.outputTrackId === null && other.outputTrackId === null;
    }
    if (this.outputTrackId === null && other.outputTrackId === null) {
      return this.inputTrackId === null && other.inputTrackId === null;
    }
    if (this.inputTrackId === null || other.inputTrackId === null) {
      return false;
    }
    if (this.outputTrackId === null || other.outputTrackId === null) {
      return false;
    }
    return this.inputTrackId.equals(other.inputTrackId) && this.outputTrackId.equals(other.outputTrackId);
  }
} 