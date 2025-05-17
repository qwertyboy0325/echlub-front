import { TrackId } from '../value-objects/TrackId';
import { IDomainEvent } from '../interfaces/IDomainEvent';

export class InputTrackAddedToBusEvent implements IDomainEvent {
  readonly eventType = 'track:input:added';
  readonly timestamp: Date;
  readonly aggregateId: string;
  readonly payload: {
    inputTrackId: string;
  };

  constructor(
    public readonly busTrackId: TrackId,
    public readonly inputTrackId: TrackId
  ) {
    this.timestamp = new Date();
    this.aggregateId = busTrackId.toString();
    this.payload = {
      inputTrackId: inputTrackId.toString()
    };
  }

  getEventName(): string {
    return 'input:added';
  }
} 
