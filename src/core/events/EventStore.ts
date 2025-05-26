import { DomainEvent } from './DomainEvent';

/**
 * 事件存儲庫接口
 * 負責存儲和檢索領域事件
 */
export interface EventStore {
  /**
   * 保存聚合根的事件
   * @param aggregateId 聚合根ID
   * @param events 要保存的事件列表
   * @param expectedVersion 預期的聚合根版本號（用於樂觀並發控制）
   */
  saveEvents(aggregateId: string, events: DomainEvent[], expectedVersion: number): Promise<void>;
  
  /**
   * 獲取聚合根的所有事件
   * @param aggregateId 聚合根ID
   * @returns 事件列表
   */
  getEventsForAggregate(aggregateId: string): Promise<DomainEvent[]>;
  
  /**
   * 獲取特定類型的所有事件
   * @param eventTypes 事件類型名稱數組
   * @returns 符合類型的事件列表
   */
  getEventsByTypes(eventTypes: string[]): Promise<DomainEvent[]>;
}

/**
 * 內存事件存儲庫實現
 * 用於開發和測試環境
 */
export class InMemoryEventStore implements EventStore {
  private events: Map<string, DomainEvent[]> = new Map();
  private allEvents: DomainEvent[] = [];
  
  /**
   * 保存聚合根的事件
   * @param aggregateId 聚合根ID
   * @param events 要保存的事件列表
   * @param expectedVersion 預期的聚合根版本號
   */
  async saveEvents(aggregateId: string, events: DomainEvent[], expectedVersion: number): Promise<void> {
    const existingEvents = this.events.get(aggregateId) || [];
    
    // 樂觀並發控制檢查
    if (existingEvents.length !== expectedVersion) {
      throw new Error(`Concurrent modification detected for aggregate ${aggregateId}. Expected version ${expectedVersion} but got ${existingEvents.length}`);
    }
    
    // 保存事件
    this.events.set(aggregateId, [...existingEvents, ...events]);
    
    // 添加到全局事件列表
    this.allEvents.push(...events);
  }
  
  /**
   * 獲取聚合根的所有事件
   * @param aggregateId 聚合根ID
   * @returns 事件列表
   */
  async getEventsForAggregate(aggregateId: string): Promise<DomainEvent[]> {
    return this.events.get(aggregateId) || [];
  }
  
  /**
   * 獲取特定類型的所有事件
   * @param eventTypes 事件類型名稱數組
   * @returns 符合類型的事件列表
   */
  async getEventsByTypes(eventTypes: string[]): Promise<DomainEvent[]> {
    return this.allEvents.filter(event => eventTypes.includes(event.eventName));
  }
} 