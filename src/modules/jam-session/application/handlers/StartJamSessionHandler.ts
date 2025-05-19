import { injectable, inject } from 'inversify';
import type { ICommandHandler } from '../../../../core/mediator/ICommandHandler';
import type { StartJamSessionCommand } from '../commands/StartJamSessionCommand';
import { JamSessionTypes } from '../../di/JamSessionTypes';
import type { ISessionRepository } from '../../domain/repositories/ISessionRepository';
import type { IJamEventBus } from '../../domain/events/IJamEventBus';
import { SessionId } from '../../domain/value-objects/SessionId';

/**
 * 開始 JamSession 命令處理器
 */
@injectable()
export class StartJamSessionHandler implements ICommandHandler<StartJamSessionCommand, void> {
  constructor(
    @inject(JamSessionTypes.SessionRepository) private readonly sessionRepository: ISessionRepository,
    @inject(JamSessionTypes.JamEventBus) private readonly eventBus: IJamEventBus
  ) {}

  /**
   * 處理開始 JamSession 命令
   * @param command 開始 JamSession 命令
   */
  async handle(command: StartJamSessionCommand): Promise<void> {
    // 獲取會話
    const session = await this.sessionRepository.findById(SessionId.fromString(command.sessionId));
    if (!session) {
      throw new Error(`Session not found: ${command.sessionId}`);
    }

    // 開始會話
    session.startJamSession();
    
    // 保存會話
    await this.sessionRepository.save(session);
    
    // 發布事件
    await this.eventBus.publish('SessionStarted', {
      sessionId: command.sessionId
    });
  }
} 