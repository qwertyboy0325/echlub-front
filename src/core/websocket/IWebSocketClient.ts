/**
 * WebSocket 客戶端介面
 */
export interface IWebSocketClient {
  /**
   * 連接到 WebSocket 服務器
   */
  connect(): Promise<void>;
  
  /**
   * 斷開與 WebSocket 服務器的連接
   */
  disconnect(): Promise<void>;
  
  /**
   * 發送消息
   */
  send(channel: string, data: any): Promise<void>;
  
  /**
   * 請求數據並等待響應
   */
  request(channel: string, data: any): Promise<any>;
  
  /**
   * 訂閱頻道
   */
  subscribe(channel: string, callback: (data: any) => void): void;
  
  /**
   * 取消訂閱頻道
   */
  unsubscribe(channel: string, callback: (data: any) => void): void;
  
  /**
   * 檢查連接狀態
   */
  isConnected(): boolean;
} 