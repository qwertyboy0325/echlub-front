import { injectable, inject } from 'inversify';
import type { ICommandHandler } from '../../../../core/mediator/ICommandHandler';
import type { CreateJamSessionCommand } from '../commands/CreateJamSessionCommand';
import { JamSessionTypes } from '../../di/JamSessionTypes';
import type { SessionRepository } from '../../domain/interfaces/SessionRepository';
import type { IJamEventBus } from '../../domain/interfaces/IJamEventBus';
import { Session } from '../../domain/aggregates/Session';
import { SessionId } from '../../domain/value-objects/SessionId';
import { JamEventTypes } from '../../domain/events/EventTypes';

/**
 * 創建 JamSession 命令處理器
 */
@injectable()
export class CreateJamSessionHandler implements ICommandHandler<CreateJamSessionCommand, string> {
  constructor(
    @inject(JamSessionTypes.SessionRepository) private readonly sessionRepository: SessionRepository,
    @inject(JamSessionTypes.JamEventBus) private readonly eventBus: IJamEventBus
  ) {}

  /**
   * 處理創建 JamSession 命令
   * @param command 創建 JamSession 命令
   */
  async handle(command: CreateJamSessionCommand): Promise<string> {
    // 生成會話 ID
    const sessionId = SessionId.generate();
    
    // 創建會話實體
    const session = Session.create(sessionId, command.roomId, command.initiatorPeerId);
    
    // 保存會話
    await this.sessionRepository.save(session);
    
    // 發布事件
    await this.eventBus.publish(JamEventTypes.SESSION_CREATED, {
      sessionId: sessionId.toString(),
      roomId: command.roomId,
      initiatorPeerId: command.initiatorPeerId
    });
    
    return sessionId.toString();
  }
} 