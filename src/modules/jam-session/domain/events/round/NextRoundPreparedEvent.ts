import { DomainEvent } from '@/core/events/DomainEvent';
import { JamEventTypes } from '../EventTypes';

/**
 * 下一回合準備事件
 * 當 JamSession 準備進入下一個回合時觸發
 */
export class NextRoundPreparedEvent extends DomainEvent {
  constructor(
    public readonly sessionId: string,
    public readonly nextRoundNumber: number
  ) {
    super(JamEventTypes.NEXT_ROUND_PREPARED, sessionId);
  }
} 