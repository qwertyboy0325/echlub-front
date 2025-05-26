import { IntegrationEvent } from '../../../../core/event-bus/IntegrationEvent';
import type { PlayerState } from '../../domain/entities/PlayerState';

export interface SessionStartedPayload {
  sessionId: string;
  startTime: Date;
  roomId: string;
  players: {
    peerId: string;
    role: string | null;
    isReady: boolean;
  }[];
}

export class SessionStartedIntegrationEvent extends IntegrationEvent {
  constructor(public readonly payload: SessionStartedPayload) {
    super();
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      timestamp: this.timestamp,
      type: this.type,
      payload: this.payload
    };
  }

  static fromDomainEvent(
    sessionId: string,
    startTime: Date,
    roomId: string,
    players: PlayerState[]
  ): SessionStartedIntegrationEvent {
    return new SessionStartedIntegrationEvent({
      sessionId,
      startTime,
      roomId,
      players: players.map(player => ({
        peerId: player.peerId,
        role: player.role?.name || null,
        isReady: player.isReady
      }))
    });
  }
} 