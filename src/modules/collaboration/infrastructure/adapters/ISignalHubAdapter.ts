/**
 * 信令中心適配器接口
 * 用於處理 WebRTC 信令交換和房間事件廣播
 */
export interface ISignalHubAdapter {
  /**
   * 連接到信令服務器
   * @param roomId 房間ID
   * @param peerId 對等方ID
   */
  connect(roomId: string, peerId: string): Promise<void>;
  
  /**
   * 斷開與信令服務器的連接
   */
  disconnect(): Promise<void>;
  
  /**
   * 發送消息到信令中心
   * @param channel 消息通道
   * @param data 消息數據
   */
  send(channel: string, data: any): Promise<void>;
  
  /**
   * 訂閱特定通道的消息
   * @param channel 消息通道
   * @param callback 接收消息的回調函數
   */
  subscribe(channel: string, callback: (data: any) => void): void;
  
  /**
   * 取消訂閱特定通道
   * @param channel 消息通道
   * @param callback 要取消的回調函數
   */
  unsubscribe(channel: string, callback: (data: any) => void): void;
  
  /**
   * 檢查連接狀態
   */
  isConnected(): boolean;
} 