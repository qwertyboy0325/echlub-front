/**
 * WebRTC 客戶端介面
 */
export interface IWebRTCClient {
  /**
   * 建立連接
   */
  establish(): Promise<void>;
  
  /**
   * 關閉連接
   */
  close(): Promise<void>;
  
  /**
   * 發送數據
   */
  sendData(channel: string, data: any): Promise<void>;
  
  /**
   * 請求數據
   */
  requestData(channel: string, data: any): Promise<any>;
  
  /**
   * 訂閱頻道
   */
  subscribe(channel: string, callback: (data: any) => void): void;
  
  /**
   * 取消訂閱頻道
   */
  unsubscribe(channel: string, callback: (data: any) => void): void;
} 