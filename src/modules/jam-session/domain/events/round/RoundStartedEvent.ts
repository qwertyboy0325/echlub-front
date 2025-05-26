import { DomainEvent } from '@/core/events/DomainEvent';
import { JamEventTypes } from '../EventTypes';

/**
 * 回合開始事件
 * @deprecated 請使用 NextRoundStartedEvent 代替
 */
export class RoundStartedEvent extends DomainEvent {
  constructor(
    public readonly sessionId: string,
    public readonly roundId: string,
    public readonly roundNumber: number,
    public readonly startTime: Date,
    public readonly durationSeconds: number
  ) {
    super(JamEventTypes.ROUND_STARTED, sessionId);
  }
} 