import { DomainEvent } from '@/core/events/DomainEvent';
import { RoleVO } from '../../value-objects/RoleVO';
import { JamEventTypes } from '../EventTypes';

/**
 * 玩家角色設置事件
 */
export class PlayerRoleSetEvent extends DomainEvent {
  constructor(
    public readonly sessionId: string,
    public readonly peerId: string,
    public readonly role: RoleVO
  ) {
    super(JamEventTypes.PLAYER_ROLE_SET, sessionId);
  }
} 