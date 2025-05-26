import { DomainEvent } from '@/core/events/DomainEvent';
import { JamEventTypes } from '../EventTypes';

export class JamSessionStartedEvent extends DomainEvent {
  constructor(
    public readonly sessionId: string,
    public readonly startTime: Date,
    public readonly playerIds: string[]
  ) {
    super(JamEventTypes.SESSION_STARTED, sessionId);
  }
} 