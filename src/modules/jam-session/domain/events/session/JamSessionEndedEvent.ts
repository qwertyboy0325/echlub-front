import { DomainEvent } from '@/core/events/DomainEvent';
import { JamEventTypes } from '../EventTypes';

export class JamSessionEndedEvent extends DomainEvent {
  constructor(
    public readonly sessionId: string,
    public readonly endTime: Date
  ) {
    super(JamEventTypes.SESSION_ENDED, sessionId);
  }
} 