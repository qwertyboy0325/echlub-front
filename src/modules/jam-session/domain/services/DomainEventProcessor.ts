import { DomainEvent } from '@/core/events/DomainEvent';

/**
 * 領域事件處理器類型
 * 定義處理特定領域事件的函數
 */
export type DomainEventHandler<T extends DomainEvent> = (event: T) => void;

/**
 * 領域事件處理服務
 * 負責在領域層內部管理事件訂閱和處理
 * 這是一個純領域服務，不依賴於任何基礎設施
 */
export class DomainEventProcessor {
  private eventHandlers: Map<string, DomainEventHandler<any>[]> = new Map();

  /**
   * 註冊事件處理器
   * @param eventType 事件類型名稱
   * @param handler 事件處理函數
   */
  public register<T extends DomainEvent>(
    eventType: string,
    handler: DomainEventHandler<T>
  ): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }

    this.eventHandlers.get(eventType)?.push(handler);
  }

  /**
   * 取消註冊事件處理器
   * @param eventType 事件類型名稱
   * @param handler 要取消的處理函數
   */
  public unregister<T extends DomainEvent>(
    eventType: string,
    handler: DomainEventHandler<T>
  ): void {
    const handlers = this.eventHandlers.get(eventType);
    if (!handlers) return;

    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
    }
  }

  /**
   * 處理領域事件
   * 尋找並執行所有已註冊的處理器
   * @param event 要處理的領域事件
   */
  public processEvent(event: DomainEvent): void {
    const handlers = this.eventHandlers.get(event.eventName) || [];
    
    for (const handler of handlers) {
      try {
        handler(event);
      } catch (error) {
        // 在領域層中，我們記錄錯誤但不處理異常
        // 異常會被傳播給調用者
        console.error(`Error processing domain event ${event.eventName}:`, error);
        throw error;
      }
    }
  }

  /**
   * 批量處理領域事件
   * 按順序處理一系列事件
   * @param events 要處理的領域事件列表
   */
  public processEvents(events: DomainEvent[]): void {
    for (const event of events) {
      this.processEvent(event);
    }
  }
} 