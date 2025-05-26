import { injectable, inject } from 'inversify';
import type { JoinJamSessionCommand } from '../commands/JoinJamSessionCommand';
import { JamSessionTypes } from '../../di/JamSessionTypes';
import type { SessionRepository } from '../../domain/interfaces/SessionRepository';
import type { IJamEventBus } from '../../domain/interfaces/IJamEventBus';
import { Session } from '../../domain/aggregates/Session';
import { BaseSessionCommandHandler } from './BaseSessionCommandHandler';

/**
 * 加入 JamSession 命令處理器
 */
@injectable()
export class JoinJamSessionHandler extends BaseSessionCommandHandler<JoinJamSessionCommand> {
  constructor(
    @inject(JamSessionTypes.SessionRepository) sessionRepository: SessionRepository,
    @inject(JamSessionTypes.JamEventBus) eventBus: IJamEventBus
  ) {
    super(sessionRepository, eventBus);
  }

  /**
   * 執行加入 JamSession 操作
   * @param command 加入 JamSession 命令
   * @param session 會話實體
   */
  protected async executeOperation(command: JoinJamSessionCommand, session: Session): Promise<void> {
    // 添加玩家
    session.addPlayer(command.peerId);
    
    // 發布自訂事件
    await this.eventBus.publish('PlayerJoined', {
      sessionId: command.sessionId,
      peerId: command.peerId
    });
  }
} 