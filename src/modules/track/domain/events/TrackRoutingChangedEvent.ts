import { DomainEvent } from '../../../../shared/domain';
import { TrackId } from '../value-objects/TrackId';
import { TrackRouting } from '../value-objects/TrackRouting';

export class TrackRoutingChangedEvent extends DomainEvent {
  public get eventType(): string {
    return 'track:routing:changed';
  }
  
  public readonly payload: {
    routing: TrackRouting;
  };

  constructor(
    public readonly trackId: TrackId,
    public readonly routing: TrackRouting
  ) {
    super('track:routing:changed', trackId.toString());
    this.payload = {
      routing
    };
  }
} 
