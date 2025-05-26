import { IntegrationEvent } from '../../../../core/event-bus/IntegrationEvent';

export interface PlayerUnavailablePayload {
  sessionId: string;
  playerId: string;
  reason?: string;
  timestamp: Date;
  lastRole?: string;
}

export class PlayerUnavailableIntegrationEvent extends IntegrationEvent {
  constructor(public readonly payload: PlayerUnavailablePayload) {
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
    playerId: string,
    reason?: string,
    lastRole?: string
  ): PlayerUnavailableIntegrationEvent {
    return new PlayerUnavailableIntegrationEvent({
      sessionId,
      playerId,
      reason,
      timestamp: new Date(),
      lastRole
    });
  }
} 