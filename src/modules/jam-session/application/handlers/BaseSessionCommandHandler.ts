import { inject, injectable } from 'inversify';
import type { ICommand } from '../../../../core/mediator/ICommand';
import type { ICommandHandler } from '../../../../core/mediator/ICommandHandler';
import { JamSessionTypes } from '../../di/JamSessionTypes';
import type { SessionRepository } from '../../domain/interfaces/SessionRepository';
import type { IJamEventBus } from '../../domain/interfaces/IJamEventBus';
import { SessionId } from '../../domain/value-objects/SessionId';
import { DomainEventDispatcher } from '../../../../core/events/DomainEventDispatcher';
import { Session } from '../../domain/aggregates/Session';

/**
 * 會話命令基礎介面
 * 定義所有需要處理會話實體的命令共有屬性
 */
export interface SessionCommand extends ICommand<void> {
  readonly sessionId: string;
}

/**
 * 會話命令處理器基類
 * 處理從會話ID獲取會話、執行操作、分發事件、保存會話等通用邏輯
 */
@injectable()
export abstract class BaseSessionCommandHandler<TCommand extends SessionCommand> 
  implements ICommandHandler<TCommand, void> {
  
  constructor(
    @inject(JamSessionTypes.SessionRepository) protected readonly sessionRepository: SessionRepository,
    @inject(JamSessionTypes.JamEventBus) protected readonly eventBus: IJamEventBus
  ) {}

  /**
   * 處理命令的公共方法
   * @param command 命令對象
   */
  async handle(command: TCommand): Promise<void> {
    // 1. 獲取會話
    const session = await this.getSession(command.sessionId);
    
    // 2. 執行特定操作
    await this.executeOperation(command, session);
    
    // 3. 發布領域事件
    await DomainEventDispatcher.dispatchEventsForAggregate(session, this.eventBus);
    
    // 4. 保存會話
    await this.sessionRepository.save(session);
  }

  /**
   * 獲取會話的通用方法
   * @param sessionId 會話ID
   * @returns 會話實體
   * @throws 如果會話不存在
   */
  protected async getSession(sessionId: string): Promise<Session> {
    const session = await this.sessionRepository.findById(
      SessionId.fromString(sessionId)
    );
    
    if (!session) {
      throw new Error(`Session not found with ID: ${sessionId}`);
    }
    
    return session;
  }

  /**
   * 執行特定操作的抽象方法
   * 由具體的處理器類實現
   * @param command 命令對象
   * @param session 會話實體
   */
  protected abstract executeOperation(command: TCommand, session: Session): Promise<void>;
} 