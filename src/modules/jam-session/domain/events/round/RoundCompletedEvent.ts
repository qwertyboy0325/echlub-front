import { DomainEvent } from '@/core/events/DomainEvent';
import { JamEventTypes } from '../EventTypes';

/**
 * 回合完成事件
 * 當 JamSession 中的回合被標記為完成時觸發
 */
export class RoundCompletedEvent extends DomainEvent {
  constructor(
    public readonly sessionId: string,
    public readonly roundId: string,
    public readonly roundNumber: number
  ) {
    super(JamEventTypes.ROUND_COMPLETED, sessionId);
  }
} 