import { injectable, inject } from 'inversify';
import { v4 as uuidv4 } from 'uuid';
import { CollaborationTypes } from '../../../collaboration/di/CollaborationTypes';
import type { SignalingService } from '../../../collaboration/domain/interfaces/SignalingService';
import { IntegrationEventBus } from '../../../../core/event-bus/IntegrationEventBus';
import { CollaborationEvent } from '../../../collaboration/domain/events/CollaborationEvent';
import { IJamEventBus } from '../../domain/interfaces/IJamEventBus';

/**
 * 事件處理器類型
 */
type EventHandler = (event: any) => void;

/**
 * JamSession 事件總線
 * 實現 IJamEventBus 接口
 */
@injectable()
export class JamEventBus implements IJamEventBus {
  private eventHandlers: Map<string, EventHandler[]> = new Map();
  
  constructor(
    @inject(CollaborationTypes.SignalingService) private signalingService: SignalingService,
    @inject('IntegrationEventBus') private eventBus: IntegrationEventBus
  ) {
    // 訂閱所有信令事件
    this.signalingService.on('message', (message: string) => {
      try {
        const { type, payload } = JSON.parse(message);
        this.handleIncomingEvent(type, payload);
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });

    // 訂閱 CollaborationEvent
    this.eventBus.subscribe<CollaborationEvent>(
      'CollaborationEvent',
      this.handleCollaborationEvent.bind(this)
    );
  }
  
  private async handleCollaborationEvent(event: CollaborationEvent): Promise<void> {
    if (event.payload.channel === 'jam-session') {
      this.handleIncomingEvent(event.payload.data.type, event.payload.data);
    }
  }
  
  /**
   * 發布事件
   * @param eventType 事件類型
   * @param payload 事件數據
   */
  async publish(eventType: string, payload: any): Promise<void> {
    const message = JSON.stringify({
      type: eventType,
      payload,
      meta: {
        timestamp: new Date().toISOString(),
        eventId: uuidv4()
      }
    });
    
    // 通過信令服務發送事件
    await this.signalingService.sendMessage(message);
    
    // 同時在本地觸發事件
    this.handleIncomingEvent(eventType, payload);
  }
  
  /**
   * 訂閱事件
   * @param eventType 事件類型
   * @param handler 事件處理器
   */
  subscribe(eventType: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    
    this.eventHandlers.get(eventType)?.push(handler);
  }
  
  /**
   * 取消訂閱事件
   * @param eventType 事件類型
   * @param handler 事件處理器
   */
  unsubscribe(eventType: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      return;
    }
    
    const handlers = this.eventHandlers.get(eventType) || [];
    const index = handlers.indexOf(handler);
    
    if (index !== -1) {
      handlers.splice(index, 1);
    }
  }
  
  /**
   * 處理接收到的事件
   * @param eventType 事件類型
   * @param payload 事件數據
   */
  private handleIncomingEvent(eventType: string, payload: any): void {
    const handlers = this.eventHandlers.get(eventType) || [];
    
    handlers.forEach(handler => {
      try {
        handler(payload);
      } catch (error) {
        console.error(`Error in handler for event ${eventType}:`, error);
      }
    });
  }
} 