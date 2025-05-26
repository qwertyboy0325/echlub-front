import { DomainEvent } from '@/core/events/DomainEvent';

/**
 * 玩家確認下一回合事件
 */
export class PlayerConfirmedNextRoundEvent extends DomainEvent {
  constructor(
    public readonly sessionId: string,
    public readonly roundId: string,
    public readonly roundNumber: number,
    public readonly playerId: string
  ) {
    super('jam.player-confirmed-next-round', sessionId);
  }
} 