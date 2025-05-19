import { injectable, inject } from 'inversify';
import type { ICommandHandler } from '../../../../core/mediator/ICommandHandler';
import { EndCurrentRoundCommand } from '../commands/EndCurrentRoundCommand';
import { JamSessionTypes } from '../../di/JamSessionTypes';
import { SessionId } from '../../domain/value-objects/SessionId';
import type { IJamEventBus } from '../../domain/events/IJamEventBus';
import type { ISessionRepository } from '../../domain/repositories/ISessionRepository';

/**
 * 結束當前回合命令處理器
 */
@injectable()
export class EndCurrentRoundHandler implements ICommandHandler<EndCurrentRoundCommand, void> {
  constructor(
    @inject(JamSessionTypes.SessionRepository) private readonly sessionRepository: ISessionRepository,
    @inject(JamSessionTypes.JamEventBus) private readonly eventBus: IJamEventBus
  ) {}

  /**
   * 處理結束當前回合命令
   * @param command 結束當前回合命令
   */
  async handle(command: EndCurrentRoundCommand): Promise<void> {
    // 獲取會話
    const session = await this.sessionRepository.findById(
      SessionId.fromString(command.sessionId)
    );
    
    if (!session) {
      throw new Error(`Session not found: ${command.sessionId}`);
    }

    // 結束當前回合
    session.endCurrentRound();
    
    // 保存會話
    await this.sessionRepository.save(session);
    
    // 發布事件
    await this.eventBus.publish('RoundEnded', {
      sessionId: command.sessionId,
      roundNumber: session.currentRoundNumber
    });
  }
} 