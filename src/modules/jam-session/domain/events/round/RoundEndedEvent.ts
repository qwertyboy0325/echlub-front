import { DomainEvent } from '@/core/events/DomainEvent';
import { JamEventTypes } from '../EventTypes';

/**
 * 回合結束事件
 * @deprecated 請使用 CurrentRoundEndedEvent 代替
 */
export class RoundEndedEvent extends DomainEvent {
  constructor(
    public readonly sessionId: string,
    public readonly roundId: string,
    public readonly roundNumber: number,
    public readonly endTime: Date
  ) {
    super(JamEventTypes.ROUND_ENDED, sessionId);
  }
} 