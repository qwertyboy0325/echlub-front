import { DomainEvent } from '../../../../shared/domain';
import { TrackId } from '../value-objects/TrackId';
import { ClipId } from '../value-objects/ClipId';

export class ClipAddedToTrackEvent extends DomainEvent {
  public get eventType(): string {
    return 'track:clip:added';
  }
  
  public readonly payload: {
    clipId: string;
    type: 'audio' | 'midi';
  };

  constructor(
    public readonly trackId: TrackId,
    public readonly clipId: ClipId,
    public readonly type: 'audio' | 'midi'
  ) {
    super('clip:added', trackId.toString());
    this.payload = {
      clipId: clipId.toString(),
      type
    };
  }
} 
