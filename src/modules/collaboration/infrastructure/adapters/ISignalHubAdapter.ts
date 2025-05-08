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

  /**
   * 啟用 WebRTC 備援模式
   * 當 P2P 連接失敗時，通過伺服器中繼數據
   * @param peerId 需要啟用備援模式的對等方ID
   */
  activateWebRTCFallback(peerId: string): Promise<void>;
  
  /**
   * 通過伺服器中繼發送數據
   * 當 WebRTC 連接失敗時使用
   * @param targetPeerId 目標對等方ID
   * @param data 要發送的數據
   */
  relayData(targetPeerId: string, data: any): Promise<void>;
  
  /**
   * 訂閱 WebRTC 備援模式建議事件
   * @param callback 當系統建議使用備援模式時的回調
   */
  onWebRTCFallbackSuggested(callback: (data: { peerId: string, reason: string }) => void): void;
  
  /**
   * 訂閱 WebRTC 備援模式需求事件
   * @param callback 當對方啟用備援模式時的回調
   */
  onWebRTCFallbackNeeded(callback: (data: { peerId: string }) => void): void;
  
  /**
   * 訂閱 WebRTC 備援模式啟用成功事件
   * @param callback 當備援模式啟用成功時的回調
   */
  onWebRTCFallbackActivated(callback: (data: { peerId: string }) => void): void;
  
  /**
   * 訂閱通過伺服器中繼接收的數據
   * @param callback 接收中繼數據的回調
   */
  onRelayData(callback: (data: { from: string, payload: any }) => void): void;
} 