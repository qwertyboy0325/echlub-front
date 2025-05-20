import { EventStore } from '../events/EventStore';
import { EventSourcedAggregateRoot } from '../entities/EventSourcedAggregateRoot';

/**
 * 事件溯源存儲庫基類
 * 提供事件溯源聚合根的基本存儲和檢索功能
 */
export abstract class EventSourcedRepository<T extends EventSourcedAggregateRoot> {
  /**
   * 建構函數
   * @param eventStore 事件存儲庫實例
   */
  constructor(protected readonly eventStore: EventStore) {}
  
  /**
   * 建立聚合根實例
   * 子類必須實現此方法，用於創建空的聚合根實例
   */
  protected abstract createEmptyAggregate(): T;
  
  /**
   * 獲取聚合根 ID
   * 子類必須實現此方法，用於從聚合根獲取 ID
   * @param aggregate 聚合根實例
   */
  protected abstract getAggregateId(aggregate: T): string;
  
  /**
   * 通過 ID 查找聚合根
   * @param id 聚合根 ID
   * @returns 聚合根實例
   */
  async findById(id: string): Promise<T | null> {
    // 獲取此聚合根的所有事件
    const events = await this.eventStore.getEventsForAggregate(id);
    
    if (events.length === 0) {
      return null;
    }
    
    // 創建空的聚合根實例
    const aggregate = this.createEmptyAggregate();
    
    // 從事件歷史重建聚合根狀態
    aggregate.loadFromHistory(events);
    
    return aggregate;
  }
  
  /**
   * 保存聚合根
   * @param aggregate 聚合根實例
   */
  async save(aggregate: T): Promise<void> {
    const id = this.getAggregateId(aggregate);
    const uncommittedEvents = aggregate.getUncommittedEvents();
    
    if (uncommittedEvents.length === 0) {
      return; // 沒有新事件，無需保存
    }
    
    // 保存未提交的事件
    await this.eventStore.saveEvents(
      id, 
      uncommittedEvents, 
      aggregate.version - uncommittedEvents.length
    );
    
    // 清除已保存的事件
    aggregate.clearUncommittedEvents();
  }
} 