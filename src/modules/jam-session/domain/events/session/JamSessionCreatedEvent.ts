import { DomainEvent } from '@/core/events/DomainEvent';
import { JamEventTypes } from '../EventTypes';

export class JamSessionCreatedEvent extends DomainEvent {
  constructor(
    public readonly sessionId: string,
    public readonly roomId: string,
    public readonly initiatorPeerId: string
  ) {
    super(JamEventTypes.SESSION_CREATED, sessionId);
  }
} 