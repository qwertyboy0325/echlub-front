import { DomainEvent } from '@/core/events/DomainEvent';
import { JamEventTypes } from '../EventTypes';

export class PlayerReadyToggledEvent extends DomainEvent {
  constructor(
    public readonly sessionId: string,
    public readonly peerId: string,
    public readonly isReady: boolean
  ) {
    super(JamEventTypes.PLAYER_READY, sessionId);
  }
} 