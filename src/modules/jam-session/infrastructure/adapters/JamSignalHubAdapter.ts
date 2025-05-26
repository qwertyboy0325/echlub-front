import { injectable, inject } from 'inversify';
import { v4 as uuidv4 } from 'uuid';
import { CollaborationTypes } from '../../../collaboration/di/CollaborationTypes';
import type { SignalingService } from '../../../collaboration/domain/interfaces/SignalingService';

/**
 * JamSession 事件類型
 */
export const JamSessionEvents = {
  SESSION_CREATED: 'jam.session-created',
  PLAYER_ROLE_SET: 'jam.player-role-set',
  PLAYER_READY: 'jam.player-ready',
  SESSION_STARTED: 'jam.session-started',
  ROUND_STARTED: 'jam.round-started',
  ROUND_ENDED: 'jam.round-ended',
  SESSION_ENDED: 'jam.session-ended',
  PLAYER_LEFT: 'jam.player-left-session',
  COUNTDOWN_TICK: 'jam.countdown-tick'
} as const;

/**
 * 事件處理器類型
 */
type EventHandler = (payload: any) => void;

/**
 * JamSession 信號中心適配器
 */
@injectable()
export class JamSignalHubAdapter {
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private _peerId: string | null = null;
  
  constructor(
    @inject(CollaborationTypes.SignalingService) private readonly signalingService: SignalingService
  ) {
    // 監聽信令服務的消息
    this.signalingService.on('message', this.handleMessage.bind(this));
  }

  /**
   * 處理收到的消息
   */
  private handleMessage(message: string): void {
    try {
      const data = JSON.parse(message);
      
      if (!this.isValidMessage(data)) {
        console.warn('Invalid message format received:', data);
        return;
      }
      
      this.notifyHandlers(data.type, data.payload);
    } catch (error) {
      console.error('Error processing message in JamSignalHubAdapter:', error);
    }
  }

  /**
   * 驗證消息格式
   */
  private isValidMessage(data: any): data is { type: string; payload: any } {
    return data && 
           typeof data.type === 'string' && 
           Object.prototype.hasOwnProperty.call(data, 'payload');
  }
  
  /**
   * 設置當前 Peer ID
   * @param peerId Peer ID
   */
  setPeerId(peerId: string): void {
    this._peerId = peerId;
  }
  
  /**
   * 獲取當前 Peer ID
   */
  get peerId(): string | null {
    return this._peerId;
  }
  
  /**
   * 發送命令
   * @param type 命令類型
   * @param payload 命令數據
   */
  async send(type: string, payload: any): Promise<void> {
    if (!this._peerId) {
      throw new Error('Cannot send message: Peer ID not set');
    }

    const message = {
      type,
      payload,
      meta: {
        timestamp: new Date().toISOString(),
        senderId: this._peerId,
        eventId: uuidv4()
      }
    };
    
    try {
      await this.signalingService.sendMessage(JSON.stringify(message));
    } catch (error) {
      console.error('Failed to send message:', error);
      throw new Error(`Failed to send message: ${error}`);
    }
  }
  
  /**
   * 訂閱事件
   * @param eventType 事件類型
   * @param handler 事件處理器
   */
  on(eventType: string, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    
    this.handlers.get(eventType)?.add(handler);
  }
  
  /**
   * 取消訂閱事件
   * @param eventType 事件類型
   * @param handler 事件處理器
   */
  off(eventType: string, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType);
    if (!handlers) return;
    
    handlers.delete(handler);
    if (handlers.size === 0) {
      this.handlers.delete(eventType);
    }
  }
  
  /**
   * 通知處理器有新事件
   * @param eventType 事件類型
   * @param payload 事件數據
   */
  private notifyHandlers(eventType: string, payload: any): void {
    const handlers = this.handlers.get(eventType);
    if (!handlers) return;
    
    handlers.forEach(handler => {
      try {
        handler(payload);
      } catch (error) {
        console.error(`Error in handler for event ${eventType}:`, error);
      }
    });
  }
} 