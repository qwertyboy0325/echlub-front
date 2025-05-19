import { injectable, inject } from 'inversify';
import type { ICommandHandler } from '../../../../core/mediator/ICommandHandler';
import { EndJamSessionCommand } from '../commands/EndJamSessionCommand';
import { JamSessionTypes } from '../../di/JamSessionTypes';
import { SessionId } from '../../domain/value-objects/SessionId';
import type { IJamEventBus } from '../../domain/events/IJamEventBus';
import type { ISessionRepository } from '../../domain/repositories/ISessionRepository';

/**
 * 結束 JamSession 命令處理器
 */
@injectable()
export class EndJamSessionHandler implements ICommandHandler<EndJamSessionCommand, void> {
  constructor(
    @inject(JamSessionTypes.SessionRepository) private readonly sessionRepository: ISessionRepository,
    @inject(JamSessionTypes.JamEventBus) private readonly eventBus: IJamEventBus
  ) {}

  /**
   * 處理結束 JamSession 命令
   * @param command 結束 JamSession 命令
   */
  async handle(command: EndJamSessionCommand): Promise<void> {
    // 獲取會話
    const session = await this.sessionRepository.findById(
      SessionId.fromString(command.sessionId)
    );
    
    if (!session) {
      throw new Error(`Session not found: ${command.sessionId}`);
    }

    // 結束會話
    session.endJamSession();
    
    // 保存會話
    await this.sessionRepository.save(session);
    
    // 發布事件
    await this.eventBus.publish('SessionEnded', {
      sessionId: command.sessionId,
      initiatorPeerId: command.initiatorPeerId
    });
  }
} 