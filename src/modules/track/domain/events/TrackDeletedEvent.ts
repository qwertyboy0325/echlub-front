import { TrackId } from '../value-objects/TrackId';

export class TrackDeletedEvent {
  constructor(
    public readonly trackId: TrackId
  ) {}
} 