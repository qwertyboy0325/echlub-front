import { DomainEvent } from '../../../../shared/domain';
import { TrackId } from '../value-objects/TrackId';
import { BaseTrack } from '../entities/BaseTrack';

export class TrackUpdatedEvent extends DomainEvent {
  public get eventType(): string {
    return 'track:updated';
  }
  
  public readonly payload: {
    track: BaseTrack;
  };

  constructor(
    public readonly trackId: TrackId,
    public readonly track: BaseTrack
  ) {
    super('track:updated', trackId.toString());
    this.payload = {
      track
    };
  }
} 
