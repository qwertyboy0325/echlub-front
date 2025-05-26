import { injectable, inject } from 'inversify';
import type { StartNextRoundCommand } from '../commands/StartNextRoundCommand';
import { JamSessionTypes } from '../../di/JamSessionTypes';
import type { SessionRepository } from '../../domain/interfaces/SessionRepository';
import type { IJamEventBus } from '../../domain/interfaces/IJamEventBus';
import type { JamTimerScheduler } from '../../infrastructure/timing/JamTimerScheduler';
import { Session } from '../../domain/aggregates/Session';
import { BaseSessionCommandHandler } from './BaseSessionCommandHandler';

/**
 * 處理開始下一回合的命令
 */
@injectable()
export class StartNextRoundHandler extends BaseSessionCommandHandler<StartNextRoundCommand> {
  private readonly timerScheduler: JamTimerScheduler;

  constructor(
    @inject(JamSessionTypes.SessionRepository) sessionRepository: SessionRepository,
    @inject(JamSessionTypes.JamEventBus) eventBus: IJamEventBus,
    @inject(JamSessionTypes.JamTimerScheduler) timerScheduler: JamTimerScheduler
  ) {
    super(sessionRepository, eventBus);
    this.timerScheduler = timerScheduler;
  }

  /**
   * 執行開始下一回合操作
   * @param command 開始下一回合命令
   * @param session 會話實體
   */
  protected async executeOperation(command: StartNextRoundCommand, session: Session): Promise<void> {
    console.log(`[StartNextRoundHandler] Starting next round for session: ${command.sessionId}`);

    try {
      // 準備下一回合
      const nextRoundNumber = session.prepareNextRound();

      console.log(`[StartNextRoundHandler] Successfully started round ${session.currentRoundNumber} for session: ${command.sessionId}`);
    } catch (error) {
      console.error(`[StartNextRoundHandler] Error starting next round:`, error);
      throw error;
    }
  }
} 