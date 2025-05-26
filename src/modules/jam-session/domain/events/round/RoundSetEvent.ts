import { DomainEvent } from '@/core/events/DomainEvent';
import { JamEventTypes } from '../EventTypes';

/**
 * 回合設置事件
 * 內部領域事件，用於設置當前回合
 */
export class RoundSetEvent extends DomainEvent {
  constructor(
    public readonly sessionId: string,
    public readonly roundId: string,
    public readonly roundNumber: number
  ) {
    // 使用 ROUND_STARTED 因為這表示回合的設置/開始
    super(JamEventTypes.ROUND_STARTED, sessionId);
  }
} 