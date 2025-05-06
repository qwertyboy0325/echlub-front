import { DomainEvent } from '../../../../shared/domain';
import { TrackId } from '../value-objects/TrackId';
import { TrackType } from '../value-objects/TrackType';

export class TrackCreatedEvent extends DomainEvent {
  public readonly payload: {
    trackId: TrackId;
    name: string;
    type: TrackType;
  };

  constructor(
    public readonly trackId: TrackId,
    public readonly name: string,
    public readonly type: TrackType
  ) {
    super('track:created', trackId.toString());
    this.payload = {
      trackId,
      name,
      type
    };
  }
} 