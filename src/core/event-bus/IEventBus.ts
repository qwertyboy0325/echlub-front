/**
 * 事件匯流排介面
 * 提供事件發布和訂閱功能
 */
export interface IEventBus {
  /**
   * 發出具名事件
   * @param eventName 事件名稱
   * @param payload 事件載荷
   */
  emit<T = any>(eventName: string, payload: T): Promise<void>;
  
  /**
   * 註冊事件處理器
   * @param eventName 事件名稱
   * @param handler 事件處理函數
   */
  on<T = any>(eventName: string, handler: (payload: T) => void): void;
  
  /**
   * 取消註冊事件處理器
   * @param eventName 事件名稱
   * @param handler 事件處理函數
   */
  off<T = any>(eventName: string, handler: (payload: T) => void): void;
  
  /**
   * 註冊一次性事件處理器
   * @param eventName 事件名稱
   * @param handler 事件處理函數
   */
  once<T = any>(eventName: string, handler: (payload: T) => void): void;
  
  /**
   * 發布事件對象
   * @param event 事件對象
   */
  publish<T>(event: T): Promise<void>;
} 
