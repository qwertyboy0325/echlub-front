/**
 * 自定義事件發射器類
 * 使用 Map 和 Set 來管理事件和監聽器
 */
export class EventEmitter {
  private listeners: Map<string, Set<Function>>;

  constructor() {
    this.listeners = new Map();
  }

  /**
   * 註冊事件監聽器
   * @param event 事件名稱
   * @param listener 監聽器函數
   */
  on(event: string, listener: Function): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(listener);
    return this;
  }

  /**
   * 移除事件監聽器
   * @param event 事件名稱
   * @param listener 監聽器函數
   */
  off(event: string, listener: Function): this {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
    return this;
  }

  /**
   * 發射事件
   * @param event 事件名稱
   * @param args 事件參數
   */
  emit(event: string, ...args: any[]): boolean {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners) {
      return false;
    }

    eventListeners.forEach(listener => {
      try {
        listener(...args);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
    return true;
  }

  /**
   * 移除所有事件監聽器
   * @param event 可選的事件名稱，如果不提供則移除所有事件的監聽器
   */
  removeAllListeners(event?: string): this {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
    return this;
  }
} 