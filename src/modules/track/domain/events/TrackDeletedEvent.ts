import { DomainEvent } from '../../../../shared/domain';
import { TrackId } from '../value-objects/TrackId';

export class TrackDeletedEvent extends DomainEvent {
  public get eventType(): string {
    return 'track:deleted';
  }
  
  public readonly payload = {};

  constructor(public readonly trackId: TrackId) {
    super('track:deleted', trackId.toString());
  }
} 
