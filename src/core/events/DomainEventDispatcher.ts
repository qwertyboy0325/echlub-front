import { DomainEvent } from '@/core/events/DomainEvent';
import { IJamEventBus } from '../../modules/jam-session/domain/interfaces/IJamEventBus';
import { EventSourcedAggregateRoot } from '@/core/entities/EventSourcedAggregateRoot';

/**
 * 領域事件發布器
 * 用於標準化處理和發布領域事件
 */
export class DomainEventDispatcher {
  /**
   * 處理單個聚合根的領域事件
   * 收集、發布並清除事件
   * @param aggregate 聚合根
   * @param eventBus 事件總線
   */
  public static async dispatchEventsForAggregate(
    aggregate: EventSourcedAggregateRoot,
    eventBus: IJamEventBus
  ): Promise<void> {
    // 獲取未提交事件
    const events = aggregate.getUncommittedEvents();
    
    // 沒有事件則直接返回
    if (events.length === 0) {
      return;
    }
    
    // 發布事件
    for (const event of events) {
      await eventBus.publish(event.eventName, event);
    }
    
    // 清除已處理的事件
    aggregate.clearUncommittedEvents();
  }
  
  /**
   * 處理多個聚合根的領域事件
   * @param aggregates 聚合根列表
   * @param eventBus 事件總線
   */
  public static async dispatchEventsForAggregates(
    aggregates: EventSourcedAggregateRoot[],
    eventBus: IJamEventBus
  ): Promise<void> {
    for (const aggregate of aggregates) {
      await this.dispatchEventsForAggregate(aggregate, eventBus);
    }
  }
  
  /**
   * 直接發布單個事件
   * @param event 領域事件
   * @param eventBus 事件總線
   */
  public static async dispatchEvent(
    event: DomainEvent,
    eventBus: IJamEventBus
  ): Promise<void> {
    await eventBus.publish(event.eventName, event);
  }
} 