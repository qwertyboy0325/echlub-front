import { injectable, inject } from 'inversify';
import type { StartJamSessionCommand } from '../commands/StartJamSessionCommand';
import { JamSessionTypes } from '../../di/JamSessionTypes';
import type { SessionRepository } from '../../domain/interfaces/SessionRepository';
import type { IJamEventBus } from '../../domain/interfaces/IJamEventBus';
import { Session } from '../../domain/aggregates/Session';
import { BaseSessionCommandHandler } from './BaseSessionCommandHandler';

/**
 * 處理開始 Jam Session 的命令
 */
@injectable()
export class StartJamSessionHandler extends BaseSessionCommandHandler<StartJamSessionCommand> {
  constructor(
    @inject(JamSessionTypes.SessionRepository) sessionRepository: SessionRepository,
    @inject(JamSessionTypes.JamEventBus) eventBus: IJamEventBus
  ) {
    super(sessionRepository, eventBus);
  }

  /**
   * 執行開始 Jam Session 操作
   * @param command 開始 Jam Session 命令
   * @param session 會話實體
   */
  protected async executeOperation(command: StartJamSessionCommand, session: Session): Promise<void> {
    // 開始 Jam Session
    session.startJamSession();
  }
} 