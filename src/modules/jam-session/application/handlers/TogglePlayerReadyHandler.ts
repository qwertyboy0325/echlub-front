import { injectable, inject } from 'inversify';
import type { TogglePlayerReadyCommand } from '../commands/TogglePlayerReadyCommand';
import { JamSessionTypes } from '../../di/JamSessionTypes';
import type { SessionRepository } from '../../domain/interfaces/SessionRepository';
import type { IJamEventBus } from '../../domain/interfaces/IJamEventBus';
import { Session } from '../../domain/aggregates/Session';
import { BaseSessionCommandHandler } from './BaseSessionCommandHandler';

/**
 * 處理切換玩家準備狀態的命令
 */
@injectable()
export class TogglePlayerReadyHandler extends BaseSessionCommandHandler<TogglePlayerReadyCommand> {
  constructor(
    @inject(JamSessionTypes.SessionRepository) sessionRepository: SessionRepository,
    @inject(JamSessionTypes.JamEventBus) eventBus: IJamEventBus
  ) {
    super(sessionRepository, eventBus);
  }

  /**
   * 執行切換玩家準備狀態操作
   * @param command 切換玩家準備狀態命令
   * @param session 會話實體
   */
  protected async executeOperation(command: TogglePlayerReadyCommand, session: Session): Promise<void> {
    // 設置玩家準備狀態
    session.setPlayerReady(command.peerId, command.isReady);
  }
} 