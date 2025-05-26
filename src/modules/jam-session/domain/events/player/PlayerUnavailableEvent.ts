import { DomainEvent } from '@/core/events/DomainEvent';
import { JamEventTypes } from '../EventTypes';

export class PlayerUnavailableEvent extends DomainEvent {
  constructor(
    public readonly sessionId: string,
    public readonly peerId: string
  ) {
    super(JamEventTypes.PLAYER_LEFT_SESSION, sessionId);
  }
} 