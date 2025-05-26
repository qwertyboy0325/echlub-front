import { DomainEvent } from '@/core/events/DomainEvent';
import { JamEventTypes } from '../EventTypes';

/**
 * 下一回合開始事件
 * 這是標準的回合開始事件，用於通知新回合開始
 */
export class NextRoundStartedEvent extends DomainEvent {
  constructor(
    public readonly sessionId: string,
    public readonly roundNumber: number,
    public readonly startTime: Date,
    public readonly durationSeconds: number
  ) {
    super(JamEventTypes.ROUND_STARTED, sessionId);
  }
} 