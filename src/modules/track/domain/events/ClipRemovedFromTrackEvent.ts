import { DomainEvent } from '../../../../shared/domain';
import { TrackId } from '../value-objects/TrackId';
import { ClipId } from '../value-objects/ClipId';

export class ClipRemovedFromTrackEvent extends DomainEvent {
  public get eventType(): string {
    return 'track:clip:removed';
  }
  
  public readonly payload: {
    clipId: string;
    clipType: 'audio' | 'midi';
  };

  constructor(
    public readonly trackId: TrackId,
    public readonly clipId: ClipId,
    public readonly clipType: 'audio' | 'midi'
  ) {
    super('clip:removed', trackId.toString());
    this.payload = {
      clipId: clipId.toString(),
      clipType
    };
  }
} 