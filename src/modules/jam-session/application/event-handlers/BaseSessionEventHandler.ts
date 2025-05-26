import { inject, injectable } from 'inversify';
import { JamSessionTypes } from '../../di/JamSessionTypes';
import type { SessionRepository } from '../../domain/interfaces/SessionRepository';
import type { IJamEventBus } from '../../domain/interfaces/IJamEventBus';
import { DomainEventDispatcher } from '../../../../core/events/DomainEventDispatcher';
import { Session } from '../../domain/aggregates/Session';

/**
 * 基礎會話事件處理器類
 * 處理從房間 ID 獲取會話、執行操作、分發事件、保存會話等通用邏輯
 */
@injectable()
export abstract class BaseSessionEventHandler<TEvent> {
  constructor(
    @inject(JamSessionTypes.SessionRepository) protected readonly sessionRepository: SessionRepository,
    @inject(JamSessionTypes.JamEventBus) protected readonly eventBus: IJamEventBus
  ) {}

  /**
   * 處理事件的公共方法
   * @param event 事件對象
   */
  async handle(event: TEvent): Promise<void> {
    // 1. 獲取會話
    const session = await this.getSessionFromEvent(event);
    
    // 如果沒有找到會話，直接返回
    if (!session) {
      return;
    }
    
    // 2. 執行特定操作
    await this.executeOperation(event, session);
    
    // 如果有更新會話，則分發事件並保存
    if (session.getUncommittedEvents().length > 0) {
      // 3. 發布領域事件
      await DomainEventDispatcher.dispatchEventsForAggregate(session, this.eventBus);
      
      // 4. 保存會話
      await this.sessionRepository.save(session);
    }
  }

  /**
   * 從事件獲取會話的抽象方法
   * 由具體的處理器類實現
   * @param event 事件對象
   * @returns 會話實體，如果找不到則返回 null
   */
  protected abstract getSessionFromEvent(event: TEvent): Promise<Session | null>;

  /**
   * 執行特定操作的抽象方法
   * 由具體的處理器類實現
   * @param event 事件對象
   * @param session 會話實體
   */
  protected abstract executeOperation(event: TEvent, session: Session): Promise<void>;
} 