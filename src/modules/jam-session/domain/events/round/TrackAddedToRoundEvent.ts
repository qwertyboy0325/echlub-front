import { DomainEvent } from '@/core/events/DomainEvent';

/**
 * 音軌添加到回合事件
 */
export class TrackAddedToRoundEvent extends DomainEvent {
  constructor(
    public readonly sessionId: string,
    public readonly roundId: string,
    public readonly roundNumber: number,
    public readonly trackId: string,
    public readonly playerId: string
  ) {
    super('jam.track-added-to-round', sessionId);
  }
} 