import { IntegrationEvent } from '../../../../core/event-bus/IntegrationEvent';

export interface PlayerRoleChangedPayload {
  playerId: string;
  oldRole: string;
  newRole: string;
  sessionId: string;
}

export class PlayerRoleChangedEvent extends IntegrationEvent {
  constructor(public readonly payload: PlayerRoleChangedPayload) {
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
} 