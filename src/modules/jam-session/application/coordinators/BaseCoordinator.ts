import { JamSessionDomainService } from '../../domain/services/JamSessionDomainService';
import { DomainEventDispatcher } from '../../../../core/events/DomainEventDispatcher';
import { DomainError } from '../../../../core/domain/DomainError';
import { Session } from '../../domain/aggregates/Session';
import { Round } from '../../domain/aggregates/Round';
import type { IJamEventBus } from '../../domain/interfaces/IJamEventBus';

/**
 * 基礎協調器類
 * 提供共用的協調器功能
 */
export abstract class BaseCoordinator {
    protected readonly domainService: JamSessionDomainService;  constructor(protected readonly eventBus: IJamEventBus) {    this.domainService = new JamSessionDomainService();  }

  /**
   * 設置事件處理器
   * 子類必須實現此方法來註冊其特定的事件處理器
   */
  protected abstract setupEventHandlers(): void;

  /**
   * 安全地執行領域操作
   * 統一處理錯誤和事件分發
   */
  protected async executeDomainOperation<T>(
    operation: () => Promise<T>,
    errorMessage: string
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }
      console.error(`${errorMessage}:`, error);
      throw new Error(errorMessage);
    }
  }

  /**
   * 分發會話聚合根的領域事件
   */
  protected async dispatchSessionEvents(session: Session): Promise<void> {
    await DomainEventDispatcher.dispatchEventsForAggregate(session as any, this.eventBus);
  }

  /**
   * 分發回合聚合根的領域事件
   */
  protected async dispatchRoundEvents(round: Round): Promise<void> {
    await DomainEventDispatcher.dispatchEventsForAggregate(round as any, this.eventBus);
  }

  /**
   * 處理事件處理器中的錯誤
   */
  protected handleEventError(eventName: string, error: unknown): void {
    console.error(`Error handling ${eventName} event:`, error);
    // 可以添加額外的錯誤處理邏輯，如事件重試、補償等
  }

  /**
   * 驗證聚合根存在性
   */
  protected validateExists<T>(
    entity: T | null,
    entityName: string,
    id: string
  ): asserts entity is T {
    if (!entity) {
      throw new Error(`${entityName} not found: ${id}`);
    }
  }
} 