import { injectable, inject } from 'inversify';
import type { ICommandHandler } from '../../../../core/mediator/ICommandHandler';
import type { SetPlayerRoleCommand } from '../commands/SetPlayerRoleCommand';
import { JamSessionTypes } from '../../di/JamSessionTypes';
import type { ISessionRepository } from '../../domain/repositories/ISessionRepository';
import type { IJamEventBus } from '../../domain/events/IJamEventBus';
import { SessionId } from '../../domain/value-objects/SessionId';
import { RoleVO } from '../../domain/value-objects/RoleVO';

/**
 * 設置玩家角色命令處理器
 */
@injectable()
export class SetPlayerRoleHandler implements ICommandHandler<SetPlayerRoleCommand, void> {
  constructor(
    @inject(JamSessionTypes.SessionRepository) private readonly sessionRepository: ISessionRepository,
    @inject(JamSessionTypes.JamEventBus) private readonly eventBus: IJamEventBus
  ) {}

  /**
   * 處理設置玩家角色命令
   * @param command 設置玩家角色命令
   */
  async handle(command: SetPlayerRoleCommand): Promise<void> {
    // 獲取會話
    const session = await this.sessionRepository.findById(SessionId.fromString(command.sessionId));
    if (!session) {
      throw new Error(`Session not found: ${command.sessionId}`);
    }

    // 創建角色值對象
    const role = RoleVO.create(command.roleId, command.roleName, command.roleColor);
    
    // 設置玩家角色
    session.setPlayerRole(command.peerId, role);
    
    // 保存會話
    await this.sessionRepository.save(session);
    
    // 發布事件
    await this.eventBus.publish('PlayerRoleChanged', {
      sessionId: command.sessionId,
      peerId: command.peerId,
      roleId: command.roleId,
      roleName: command.roleName,
      roleColor: command.roleColor
    });
  }
} 