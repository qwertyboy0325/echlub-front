import { DomainEvent } from '@/core/events/DomainEvent';
import { JamEventTypes } from '../EventTypes';

/**
 * 玩家加入會話事件
 */
export class PlayerAddedEvent extends DomainEvent {
  constructor(
    public readonly sessionId: string,
    public readonly peerId: string
  ) {
    super(JamEventTypes.PLAYER_ADDED, sessionId);
  }
} 