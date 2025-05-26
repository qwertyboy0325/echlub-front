import { injectable, inject } from 'inversify';
import type { SetPlayerRoleCommand } from '../commands/SetPlayerRoleCommand';
import { JamSessionTypes } from '../../di/JamSessionTypes';
import type { SessionRepository } from '../../domain/interfaces/SessionRepository';
import type { IJamEventBus } from '../../domain/interfaces/IJamEventBus';
import type { RoleRegistry } from '../services/RoleRegistry';
import { Session } from '../../domain/aggregates/Session';
import { BaseSessionCommandHandler } from './BaseSessionCommandHandler';

/**
 * 處理設置玩家角色的命令
 */
@injectable()
export class SetPlayerRoleHandler extends BaseSessionCommandHandler<SetPlayerRoleCommand> {
  private readonly roleRegistry: RoleRegistry;

  constructor(
    @inject(JamSessionTypes.SessionRepository) sessionRepository: SessionRepository,
    @inject(JamSessionTypes.JamEventBus) eventBus: IJamEventBus,
    @inject(JamSessionTypes.RoleRegistry) roleRegistry: RoleRegistry
  ) {
    super(sessionRepository, eventBus);
    this.roleRegistry = roleRegistry;
  }

  /**
   * 執行設置玩家角色操作
   * @param command 設置玩家角色命令
   * @param session 會話實體
   */
  protected async executeOperation(command: SetPlayerRoleCommand, session: Session): Promise<void> {
    // 驗證角色 ID
    if (!this.roleRegistry.isValidRoleId(command.roleId)) {
      throw new Error(`Invalid role ID: ${command.roleId}`);
    }

    // 獲取角色
    const role = this.roleRegistry.getRoleById(command.roleId);
    if (!role) {
      throw new Error(`Role not found with ID: ${command.roleId}`);
    }

    // 設置玩家角色
    session.setPlayerRole(command.peerId, role);
  }
} 