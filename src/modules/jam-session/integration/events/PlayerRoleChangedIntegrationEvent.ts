import { IntegrationEvent } from '../../../../core/events/IntegrationEvent';
import type { RoleVO } from '../../domain/value-objects/RoleVO';

export interface PlayerRoleChangedPayload {
  sessionId: string;
  peerId: string;
  role: {
    id: string;
    name: string;
    color: string;
  };
}

/**
 * 玩家角色變更整合事件
 * 當玩家角色發生變更時發布
 */
export class PlayerRoleChangedIntegrationEvent extends IntegrationEvent {
  constructor(public readonly payload: PlayerRoleChangedPayload) {
    super();
  }

  get eventType(): string {
    return 'PlayerRoleChanged';
  }

  toJSON(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      timestamp: this.timestamp,
      eventType: this.eventType,
      payload: this.payload
    };
  }

  static fromDomainEvent(
    sessionId: string,
    peerId: string,
    role: RoleVO
  ): PlayerRoleChangedIntegrationEvent {
    return new PlayerRoleChangedIntegrationEvent({
      sessionId,
      peerId,
      role: {
        id: role.id,
        name: role.name,
        color: role.color
      }
    });
  }
} 