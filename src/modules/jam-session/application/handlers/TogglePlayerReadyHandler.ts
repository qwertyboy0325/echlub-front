import { injectable, inject } from 'inversify';
import type { ICommandHandler } from '../../../../core/mediator/ICommandHandler';
import type { TogglePlayerReadyCommand } from '../commands/TogglePlayerReadyCommand';
import { JamSessionTypes } from '../../di/JamSessionTypes';
import type { ISessionRepository } from '../../domain/repositories/ISessionRepository';
import type { IJamEventBus } from '../../domain/events/IJamEventBus';
import { SessionId } from '../../domain/value-objects/SessionId';

/**
 * 切換玩家準備狀態命令處理器
 */
@injectable()
export class TogglePlayerReadyHandler implements ICommandHandler<TogglePlayerReadyCommand, void> {
  constructor(
    @inject(JamSessionTypes.SessionRepository) private readonly sessionRepository: ISessionRepository,
    @inject(JamSessionTypes.JamEventBus) private readonly eventBus: IJamEventBus
  ) {}

  /**
   * 處理切換玩家準備狀態命令
   * @param command 切換玩家準備狀態命令
   */
  async handle(command: TogglePlayerReadyCommand): Promise<void> {
    // 獲取會話
    const session = await this.sessionRepository.findById(SessionId.fromString(command.sessionId));
    if (!session) {
      throw new Error(`Session not found: ${command.sessionId}`);
    }

    // 設置玩家準備狀態
    session.setPlayerReady(command.peerId, command.isReady);
    
    // 保存會話
    await this.sessionRepository.save(session);
    
    // 發布事件
    await this.eventBus.publish('PlayerReadyChanged', {
      sessionId: command.sessionId,
      peerId: command.peerId,
      isReady: command.isReady
    });
  }
} 