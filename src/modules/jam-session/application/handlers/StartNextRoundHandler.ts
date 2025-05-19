import { injectable, inject } from 'inversify';
import type { ICommandHandler } from '../../../../core/mediator/ICommandHandler';
import { StartNextRoundCommand } from '../commands/StartNextRoundCommand';
import { JamSessionTypes } from '../../di/JamSessionTypes';
import { SessionId } from '../../domain/value-objects/SessionId';
import type { IJamEventBus } from '../../domain/events/IJamEventBus';
import type { ISessionRepository } from '../../domain/repositories/ISessionRepository';

/**
 * 開始下一回合命令處理器
 */
@injectable()
export class StartNextRoundHandler implements ICommandHandler<StartNextRoundCommand, void> {
    constructor(    @inject(JamSessionTypes.SessionRepository) private readonly sessionRepository: ISessionRepository,    @inject(JamSessionTypes.JamEventBus) private readonly eventBus: IJamEventBus  ) {}

  /**
   * 處理開始下一回合命令
   * @param command 開始下一回合命令
   */
  async handle(command: StartNextRoundCommand): Promise<void> {
    // 獲取會話
    const session = await this.sessionRepository.findById(
      SessionId.fromString(command.sessionId)
    );
    
    if (!session) {
      throw new Error(`Session not found: ${command.sessionId}`);
    }

    // 開始下一回合
    session.startNextRound(command.durationSeconds);
    
    // 保存會話
    await this.sessionRepository.save(session);
    
    // 發布事件
    await this.eventBus.publish('RoundStarted', {
      sessionId: command.sessionId,
      roundNumber: session.currentRoundNumber,
      durationSeconds: command.durationSeconds
    });
  }
} 