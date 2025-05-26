import { DomainEvent } from '@/core/events/DomainEvent';
import { JamEventTypes } from '../EventTypes';

/**
 * 當前回合結束事件
 * 這是標準的回合結束事件，用於通知回合結束
 */
export class CurrentRoundEndedEvent extends DomainEvent {
  constructor(
    public readonly sessionId: string,
    public readonly roundNumber: number,
    public readonly endTime: Date
  ) {
    super(JamEventTypes.ROUND_ENDED, sessionId);
  }
} 