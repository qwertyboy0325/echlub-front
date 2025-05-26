import { injectable } from 'inversify';
import type { SignalingService, SignalingEventType, SignalingEventHandler } from '../domain/interfaces/SignalingService';
import { PeerId } from '../domain/value-objects/PeerId';
import { RoomId } from '../domain/value-objects/RoomId';
import { ConnectionState } from '../domain/value-objects/ConnectionState';

/**
 * WebRTC 信令服務實作
 */
@injectable()
export class WebRTCSignalingService implements SignalingService {
  private eventHandlers: Map<SignalingEventType, Set<SignalingEventHandler>> = new Map();
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private currentRoomId: RoomId | null = null;
  private localPeerId: PeerId | null = null;

  /**
   * 發送消息
   */
  async sendMessage(message: string): Promise<void> {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      throw new Error('Data channel not ready');
    }

    this.dataChannel.send(message);
  }

  /**
   * 訂閱事件
   */
  on<T = any>(event: SignalingEventType, handler: SignalingEventHandler<T>): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)?.add(handler);
  }

  /**
   * 取消訂閱事件
   */
  off<T = any>(event: SignalingEventType, handler: SignalingEventHandler<T>): void {
    this.eventHandlers.get(event)?.delete(handler);
  }

  /**
   * 連接到信令伺服器
   */
  async connect(roomId: RoomId, peerId: PeerId): Promise<boolean> {
    this.currentRoomId = roomId;
    this.localPeerId = peerId;
    this.connectionState = ConnectionState.CONNECTING;

    try {
      this.peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      });

      this.setupPeerConnection();
      this.connectionState = ConnectionState.CONNECTED;
      return true;
    } catch (error) {
      console.error('[WebRTCSignalingService] Connection error:', error);
      this.connectionState = ConnectionState.DISCONNECTED;
      return false;
    }
  }

  /**
   * 設置 WebRTC 連接
   */
  private setupPeerConnection(): void {
    if (!this.peerConnection) return;

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.notifyHandlers('ice-candidate', { candidate: event.candidate });
      }
    };

    this.peerConnection.ondatachannel = (event) => {
      this.dataChannel = event.channel;
      this.setupDataChannel();
    };
  }

  /**
   * 設置數據通道
   */
  private setupDataChannel(): void {
    if (!this.dataChannel) return;

    this.dataChannel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.notifyHandlers('message', data);
      } catch (error) {
        console.error('[WebRTCSignalingService] Message parsing error:', error);
      }
    };

    this.dataChannel.onerror = (error) => {
      console.error('[WebRTCSignalingService] Data channel error:', error);
      this.connectionState = ConnectionState.DISCONNECTED;
    };
  }

  /**
   * 通知事件處理器
   */
  private notifyHandlers<T = any>(event: SignalingEventType, payload: T): void {
    const handlers = this.eventHandlers.get(event);
    handlers?.forEach(handler => {
      try {
        handler(payload);
      } catch (error) {
        console.error(`[WebRTCSignalingService] Handler error for ${event}:`, error);
      }
    });
  }

  /**
   * 發送 Offer
   */
  async sendOffer(to: PeerId, offer: RTCSessionDescriptionInit): Promise<void> {
    await this.sendMessage(JSON.stringify({
      type: 'offer',
      to: to.toString(),
      from: this.localPeerId?.toString(),
      offer
    }));
  }

  /**
   * 發送 Answer
   */
  async sendAnswer(to: PeerId, answer: RTCSessionDescriptionInit): Promise<void> {
    await this.sendMessage(JSON.stringify({
      type: 'answer',
      to: to.toString(),
      from: this.localPeerId?.toString(),
      answer
    }));
  }

  /**
   * 發送 ICE Candidate
   */
  async sendIceCandidate(to: PeerId, candidate: RTCIceCandidate): Promise<void> {
    await this.sendMessage(JSON.stringify({
      type: 'ice-candidate',
      to: to.toString(),
      from: this.localPeerId?.toString(),
      candidate
    }));
  }

  /**
   * 發送重連請求
   */
  async sendReconnectRequest(to: PeerId): Promise<void> {
    await this.sendMessage(JSON.stringify({
      type: 'reconnect-request',
      to: to.toString(),
      from: this.localPeerId?.toString()
    }));
  }

  /**
   * 啟用備用模式
   */
  async activateFallback(to: PeerId): Promise<void> {
    await this.sendMessage(JSON.stringify({
      type: 'webrtc-fallback-activate',
      to: to.toString(),
      from: this.localPeerId?.toString()
    }));
  }

  /**
   * 轉發數據
   */
  async relayData(to: PeerId, channel: string, data: any): Promise<boolean> {
    try {
      await this.sendMessage(JSON.stringify({
        type: 'relay-data',
        to: to.toString(),
        from: this.localPeerId?.toString(),
        payload: { channel, data }
      }));
      return true;
    } catch (error) {
      console.error('[WebRTCSignalingService] Relay data error:', error);
      return false;
    }
  }

  /**
   * 斷開連接
   */
  async disconnect(): Promise<void> {
    this.dataChannel?.close();
    this.peerConnection?.close();
    this.dataChannel = null;
    this.peerConnection = null;
    this.connectionState = ConnectionState.DISCONNECTED;
    this.currentRoomId = null;
    this.localPeerId = null;
    this.eventHandlers.clear();
  }

  /**
   * 獲取連接狀態
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }
} 