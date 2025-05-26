import { injectable, inject } from 'inversify';
import { EndJamSessionCommand } from '../commands/EndJamSessionCommand';
import { JamSessionTypes } from '../../di/JamSessionTypes';
import type { SessionRepository } from '../../domain/interfaces/SessionRepository';
import type { IJamEventBus } from '../../domain/interfaces/IJamEventBus';
import { Session } from '../../domain/aggregates/Session';
import { BaseSessionCommandHandler } from './BaseSessionCommandHandler';

/**
 * 結束 JamSession 命令處理器
 */
@injectable()
export class EndJamSessionHandler extends BaseSessionCommandHandler<EndJamSessionCommand> {
  constructor(
    @inject(JamSessionTypes.SessionRepository) sessionRepository: SessionRepository,
    @inject(JamSessionTypes.JamEventBus) eventBus: IJamEventBus
  ) {
    super(sessionRepository, eventBus);
  }

  /**
   * 執行結束 JamSession 操作
   * @param command 結束 JamSession 命令
   * @param session 會話實體
   */
  protected async executeOperation(command: EndJamSessionCommand, session: Session): Promise<void> {
    // 結束會話
    session.endJamSession();
    
    // 發布自訂事件
    await this.eventBus.publish('SessionEnded', {
      sessionId: command.sessionId,
      initiatorPeerId: command.initiatorPeerId
    });
  }
} 