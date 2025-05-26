import { injectable, inject } from 'inversify';
import { EndCurrentRoundCommand } from '../commands/EndCurrentRoundCommand';
import { JamSessionTypes } from '../../di/JamSessionTypes';
import type { IJamEventBus } from '../../domain/interfaces/IJamEventBus';
import type { SessionRepository } from '../../domain/interfaces/SessionRepository';
import { Session } from '../../domain/aggregates/Session';
import { BaseSessionCommandHandler } from './BaseSessionCommandHandler';

/**
 * 結束當前回合命令處理器
 */
@injectable()
export class EndCurrentRoundHandler extends BaseSessionCommandHandler<EndCurrentRoundCommand> {
  constructor(
    @inject(JamSessionTypes.SessionRepository) sessionRepository: SessionRepository,
    @inject(JamSessionTypes.JamEventBus) eventBus: IJamEventBus
  ) {
    super(sessionRepository, eventBus);
  }

  /**
   * 執行結束當前回合操作
   * @param command 結束當前回合命令
   * @param session 會話實體
   */
  protected async executeOperation(command: EndCurrentRoundCommand, session: Session): Promise<void> {
    // 檢查當前回合
    if (!session.currentRoundId) {
      throw new Error('No active round to end');
    }
    
    // 標記當前回合已完成
    session.markRoundCompleted(session.currentRoundId);
  }
} 