import { TrackId } from '../value-objects/TrackId';

export class TrackUpdatedEvent {
  constructor(
    public readonly trackId: TrackId,
    public readonly changes: Partial<{
      name: string;
      volume: number;
      mute: boolean;
      solo: boolean;
    }>
  ) {}
} 