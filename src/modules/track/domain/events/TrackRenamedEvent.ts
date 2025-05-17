import { DomainEvent } from '../../../../shared/domain';
import { TrackId } from '../value-objects/TrackId';

export class TrackRenamedEvent extends DomainEvent {
  public get eventType(): string {
    return 'track:renamed';
  }
  
  public readonly payload: {
    newName: string;
  };

  constructor(
    public readonly trackId: TrackId,
    public readonly newName: string
  ) {
    super('track:renamed', trackId.toString());
    this.payload = {
      newName
    };
  }
} 
