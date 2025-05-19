import { injectable, inject } from 'inversify';
import type { ICommandHandler } from '../../../../core/mediator/ICommandHandler';
import type { JoinJamSessionCommand } from '../commands/JoinJamSessionCommand';
import { JamSessionTypes } from '../../di/JamSessionTypes';
import type { ISessionRepository } from '../../domain/repositories/ISessionRepository';
import type { IJamEventBus } from '../../domain/events/IJamEventBus';
import { SessionId } from '../../domain/value-objects/SessionId';

/**
 * 加入 JamSession 命令處理器
 */
@injectable()
export class JoinJamSessionHandler implements ICommandHandler<JoinJamSessionCommand, void> {
  constructor(
    @inject(JamSessionTypes.SessionRepository) private readonly sessionRepository: ISessionRepository,
    @inject(JamSessionTypes.JamEventBus) private readonly eventBus: IJamEventBus
  ) {}

  /**
   * 處理加入 JamSession 命令
   * @param command 加入 JamSession 命令
   */
  async handle(command: JoinJamSessionCommand): Promise<void> {
    // 獲取會話
    const session = await this.sessionRepository.findById(SessionId.fromString(command.sessionId));
    if (!session) {
      throw new Error(`Session not found: ${command.sessionId}`);
    }

    // 添加玩家
    session.addPlayer(command.peerId);
    
    // 保存會話
    await this.sessionRepository.save(session);
    
    // 發布事件
    await this.eventBus.publish('PlayerJoined', {
      sessionId: command.sessionId,
      peerId: command.peerId
    });
  }
} 