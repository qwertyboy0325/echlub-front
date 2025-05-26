/**
 * JamSession 事件總線介面
 * 定義領域層需要的事件發布與訂閱功能
 */
export interface IJamEventBus {
  /**
   * 發布事件
   * @param eventName 事件名稱
   * @param payload 事件資料
   */
  publish(eventName: string, payload: object): Promise<void>;
  
  /**
   * 訂閱事件
   * @param eventName 事件名稱
   * @param handler 事件處理器
   */
  subscribe(eventName: string, handler: (event: any) => void): void;
  
  /**
   * 取消訂閱事件
   * @param eventName 事件名稱
   * @param handler 事件處理器
   */
  unsubscribe(eventName: string, handler: (event: any) => void): void;
} 