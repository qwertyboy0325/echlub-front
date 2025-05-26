import { DomainEvent } from '@/core/events/DomainEvent';

export class PlayerCompletedRoundEvent extends DomainEvent {
  constructor(
    public readonly sessionId: string,
    public readonly roundNumber: number,
    public readonly peerId: string
  ) {
    super('jam.player-completed-round', sessionId);
  }
} 