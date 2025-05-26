import { PeerId } from '../value-objects/PeerId';
import { RoomId } from '../value-objects/RoomId';
import { ConnectionState } from '../value-objects/ConnectionState';

/**
 * 信令事件類型
 */
export type SignalingEventType = 
  | 'message'
  | 'offer'
  | 'answer'
  | 'ice-candidate'
  | 'reconnect-request'
  | 'webrtc-fallback-activate'
  | 'relay-data';

/**
 * 信令事件處理器類型
 */
export type SignalingEventHandler<T = any> = (payload: T) => void;

/**
 * 信令服務介面
 */
export interface SignalingService {
  /**
   * 發送消息
   */
  sendMessage(message: string): Promise<void>;

  /**
   * 訂閱事件
   */
  on<T = any>(event: SignalingEventType, handler: SignalingEventHandler<T>): void;

  /**
   * 取消訂閱事件
   */
  off<T = any>(event: SignalingEventType, handler: SignalingEventHandler<T>): void;

  /**
   * 連接到信令伺服器
   */
  connect(roomId: RoomId, peerId: PeerId): Promise<boolean>;

  /**
   * 發送 Offer
   */
  sendOffer(to: PeerId, offer: RTCSessionDescriptionInit): Promise<void>;

  /**
   * 發送 Answer
   */
  sendAnswer(to: PeerId, answer: RTCSessionDescriptionInit): Promise<void>;

  /**
   * 發送 ICE Candidate
   */
  sendIceCandidate(to: PeerId, candidate: RTCIceCandidate): Promise<void>;

  /**
   * 發送重連請求
   */
  sendReconnectRequest(to: PeerId): Promise<void>;

  /**
   * 啟用備用模式
   */
  activateFallback(to: PeerId): Promise<void>;

  /**
   * 轉發數據
   */
  relayData(to: PeerId, channel: string, data: any): Promise<boolean>;

  /**
   * 斷開連接
   */
  disconnect(): Promise<void>;

  /**
   * 獲取連接狀態
   */
  getConnectionState(): ConnectionState;
} 
