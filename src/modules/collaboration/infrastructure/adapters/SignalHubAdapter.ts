import { injectable, inject } from 'inversify';
import { ISignalHubAdapter } from './ISignalHubAdapter';
import { CollaborationTypes } from '../../di/CollaborationTypes';
import { PeerId } from '../../domain/value-objects/PeerId';
import { TYPES } from '../../../../core/di/types';
import type { IEventBus } from '../../../../core/event-bus/IEventBus';

// WebRTC 備援相關事件常量
const WEBRTC_EVENTS = {
  FALLBACK_SUGGESTED: 'webrtc-fallback-suggested',
  FALLBACK_NEEDED: 'webrtc-fallback-needed',
  FALLBACK_ACTIVATE: 'webrtc-fallback-activate',
  FALLBACK_ACTIVATED: 'webrtc-fallback-activated',
  RELAY_DATA: 'relay-data'
};

/**
 * SignalHub 適配器實現
 * 使用 WebSocket 實現信令交換和房間事件廣播
 */
@injectable()
export class SignalHubAdapter implements ISignalHubAdapter {
  private socket: WebSocket | null = null;
  private isReconnecting = false;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectInterval = 2000; // 2秒
  
  private subscriptions: Map<string, Set<(data: any) => void>> = new Map();
  private connectionStatus = false;
  private currentRoomId: string | null = null;
  private currentPeerId: string | null = null;
  
  private readonly apiBaseUrl: string = import.meta.env.VITE_API_URL || 'wss://api.echlub.com';
  
  constructor(
    @inject(TYPES.EventBus)
    private readonly eventBus: IEventBus
  ) {}
  
  /**
   * 連接到信令服務器
   */
  async connect(roomId: string, peerId: string): Promise<void> {
    if (this.socket && this.socket.readyState === WebSocket.OPEN && 
        this.currentRoomId === roomId && this.currentPeerId === peerId) {
      console.log('Already connected to the same room');
      return;
    }
    
    // 如果有現有連接但房間或 ID 不同，先斷開
    if (this.socket) {
      await this.disconnect();
    }
    
    return new Promise<void>((resolve, reject) => {
      try {
        const wsUrl = `${this.apiBaseUrl}/ws?roomId=${roomId}&peerId=${peerId}`;
        this.socket = new WebSocket(wsUrl);
        this.currentRoomId = roomId;
        this.currentPeerId = peerId;
        
        this.socket.onopen = () => {
          console.log(`SignalHub connected to ${roomId} as ${peerId}`);
          this.connectionStatus = true;
          this.reconnectAttempts = 0;
          resolve();
        };
        
        this.socket.onmessage = this.handleIncomingMessage.bind(this);
        
        this.socket.onclose = (event) => {
          console.log(`SignalHub disconnected: ${event.code} - ${event.reason}`);
          this.connectionStatus = false;
          
          // 嘗試重新連接，除非是主動關閉
          if (!this.isReconnecting && event.code !== 1000) {
            this.attemptReconnect();
          }
        };
        
        this.socket.onerror = (error) => {
          console.error('SignalHub connection error:', error);
          if (!this.connectionStatus) {
            reject(new Error('Failed to connect to SignalHub'));
          }
        };
      } catch (error) {
        console.error('Error connecting to SignalHub:', error);
        reject(error);
      }
    });
  }
  
  /**
   * 嘗試重新連接
   */
  private attemptReconnect(): void {
    if (this.isReconnecting || this.reconnectAttempts >= this.maxReconnectAttempts || 
        !this.currentRoomId || !this.currentPeerId) {
      return;
    }
    
    this.isReconnecting = true;
    this.reconnectAttempts++;
    
    console.log(`Attempting to reconnect to SignalHub (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    setTimeout(async () => {
      try {
        await this.connect(this.currentRoomId!, this.currentPeerId!);
        this.isReconnecting = false;
        console.log('Successfully reconnected to SignalHub');
        
        // 通知重新連接成功
        this.eventBus.publish({
          type: 'signalhub.reconnected',
          roomId: this.currentRoomId,
          peerId: this.currentPeerId
        });
      } catch (error) {
        console.error('Reconnection attempt failed:', error);
        this.isReconnecting = false;
        
        // 如果還有嘗試次數，繼續重連
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect();
        } else {
          console.error('Max reconnection attempts reached');
          // 通知重連失敗
          this.eventBus.publish({
            type: 'signalhub.reconnect-failed',
            roomId: this.currentRoomId,
            peerId: this.currentPeerId
          });
        }
      }
    }, this.reconnectInterval);
  }
  
  /**
   * 斷開與信令服務器的連接
   */
  async disconnect(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
        this.connectionStatus = false;
        this.currentRoomId = null;
        this.currentPeerId = null;
        resolve();
        return;
      }
      
      this.socket.onclose = () => {
        this.connectionStatus = false;
        this.currentRoomId = null;
        this.currentPeerId = null;
        this.socket = null;
        resolve();
      };
      
      this.socket.close();
    });
  }
  
  /**
   * 發送消息到信令中心
   */
  async send(channel: string, data: any): Promise<void> {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('SignalHub not connected');
    }
    
    const message = {
      module: 'collab',
      type: channel,
      payload: data
    };
    
    this.socket.send(JSON.stringify(message));
  }
  
  /**
   * 處理接收到的消息
   */
  private handleIncomingMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);
      
      // 只處理 collaboration 模塊的消息
      if (message.module !== 'collab') {
        return;
      }
      
      const { type, payload } = message;
      
      // 呼叫對應通道的訂閱者
      const listeners = this.subscriptions.get(type);
      if (listeners) {
        listeners.forEach(callback => {
          try {
            callback(payload);
          } catch (error) {
            console.error(`Error in SignalHub listener for channel ${type}:`, error);
          }
        });
      }
      
      // 同時通過 EventBus 發佈事件
      this.eventBus.publish({
        type: `collab.${type}`,
        ...payload
      });
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  }
  
  /**
   * 訂閱特定通道的消息
   */
  subscribe(channel: string, callback: (data: any) => void): void {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
    }
    
    this.subscriptions.get(channel)!.add(callback);
  }
  
  /**
   * 取消訂閱特定通道
   */
  unsubscribe(channel: string, callback: (data: any) => void): void {
    const channelSubscriptions = this.subscriptions.get(channel);
    if (channelSubscriptions) {
      channelSubscriptions.delete(callback);
      
      // 如果沒有訂閱者，移除整個通道
      if (channelSubscriptions.size === 0) {
        this.subscriptions.delete(channel);
      }
    }
  }
  
  /**
   * 檢查連接狀態
   */
  isConnected(): boolean {
    return this.connectionStatus && !!this.socket && this.socket.readyState === WebSocket.OPEN;
  }

  /**
   * 啟用 WebRTC 備援模式
   * 當 P2P 連接失敗時，通過伺服器中繼數據
   */
  async activateWebRTCFallback(peerId: string): Promise<void> {
    console.log(`Activating WebRTC fallback for peer: ${peerId}`);
    
    // 發送啟用備援模式的請求
    await this.send(WEBRTC_EVENTS.FALLBACK_ACTIVATE, {
      targetPeerId: peerId,
      reason: 'p2p-connection-failed'
    });
    
    // 將事件通過 EventBus 通知應用程式其他部分
    this.eventBus.publish({
      type: 'collab.webrtc-fallback-requested',
      peerId: peerId
    });
  }
  
  /**
   * 通過伺服器中繼發送數據
   * 當 WebRTC 連接失敗時使用
   */
  async relayData(targetPeerId: string, data: any): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('SignalHub not connected, cannot relay data');
    }
    
    // 發送中繼數據
    await this.send(WEBRTC_EVENTS.RELAY_DATA, {
      targetPeerId: targetPeerId,
      payload: data
    });
    
    // 記錄中繼傳輸
    console.log(`Data relayed to peer: ${targetPeerId}`);
  }
  
  /**
   * 訂閱 WebRTC 備援模式建議事件
   */
  onWebRTCFallbackSuggested(callback: (data: { peerId: string, reason: string }) => void): void {
    this.subscribe(WEBRTC_EVENTS.FALLBACK_SUGGESTED, callback);
  }
  
  /**
   * 訂閱 WebRTC 備援模式需求事件
   */
  onWebRTCFallbackNeeded(callback: (data: { peerId: string }) => void): void {
    this.subscribe(WEBRTC_EVENTS.FALLBACK_NEEDED, callback);
  }
  
  /**
   * 訂閱 WebRTC 備援模式啟用成功事件
   */
  onWebRTCFallbackActivated(callback: (data: { peerId: string }) => void): void {
    this.subscribe(WEBRTC_EVENTS.FALLBACK_ACTIVATED, callback);
  }
  
  /**
   * 訂閱通過伺服器中繼接收的數據
   */
  onRelayData(callback: (data: { from: string, payload: any }) => void): void {
    this.subscribe(WEBRTC_EVENTS.RELAY_DATA, callback);
  }
} 