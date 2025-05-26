import { DomainEvent } from '../events/DomainEvent';
import { EventStore } from '../events/EventStore';

/**
 * 投影處理器接口
 * 定義如何處理特定類型的事件
 */
export interface EventHandler<T extends DomainEvent> {
  /**
   * 處理特定類型的事件
   * @param event 領域事件
   */
  handle(event: T): Promise<void>;
}

/**
 * 抽象投影基類
 * 負責將事件流轉換為查詢模型
 */
export abstract class Projection {
  private readonly eventHandlers: Map<string, EventHandler<any>> = new Map();
  private lastProcessedPosition: number = 0;
  
  /**
   * 建構函數
   * @param eventStore 事件存儲庫
   */
  constructor(protected readonly eventStore: EventStore) {}
  
  /**
   * 註冊事件處理器
   * @param eventName 事件名稱
   * @param handler 事件處理器
   */
  protected registerHandler<T extends DomainEvent>(
    eventName: string, 
    handler: EventHandler<T>
  ): void {
    this.eventHandlers.set(eventName, handler);
  }
  
  /**
   * 獲取此投影關心的事件類型
   */
  protected getEventTypes(): string[] {
    return Array.from(this.eventHandlers.keys());
  }
  
  /**
   * 執行投影，處理所有相關事件
   */
  async project(): Promise<void> {
    const eventTypes = this.getEventTypes();
    const events = await this.eventStore.getEventsByTypes(eventTypes);
    
    // 按時間排序事件
    const sortedEvents = events
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    // 處理尚未投影的事件
    for (let i = this.lastProcessedPosition; i < sortedEvents.length; i++) {
      const event = sortedEvents[i];
      const handler = this.eventHandlers.get(event.eventName);
      
      if (handler) {
        await handler.handle(event);
      }
      
      this.lastProcessedPosition = i + 1;
    }
  }
  
  /**
   * 重置投影
   * 子類應該實現此方法來清除投影的查詢模型
   */
  abstract reset(): Promise<void>;
  
  /**
   * 重建投影
   * 從頭開始重新處理所有事件
   */
  async rebuild(): Promise<void> {
    // 重置投影和處理位置
    await this.reset();
    this.lastProcessedPosition = 0;
    
    // 重新投影
    await this.project();
  }
} 