import { injectable, inject } from 'inversify';
import { CoreTypes } from '@/core/di/CoreTypes';
import type { IntegrationEventBus } from '@/core/events/IntegrationEventBus';
import type { IntegrationEvent } from '@/core/events/IntegrationEvent';
import type { SignalingService } from '../../domain/interfaces/SignalingService';
import { CollaborationTypes } from '../../di/CollaborationTypes';

/**
 * 整合事件命名空間
 */
export const INTEGRATION_EVENT_NAMESPACES = {
  JAM: 'integration.jam.',
  COLLABORATION: 'integration.collaboration.',
  AUDIO: 'integration.audio.'
} as const;

/**
 * Collaboration 模組的事件處理器
 * 負責訂閱整合事件並轉發到 WebRTC
 */
@injectable()
export class CollaborationEventHandler {
  constructor(
    @inject(CoreTypes.IntegrationEventBus) private readonly integrationEventBus: IntegrationEventBus,
    @inject(CollaborationTypes.SignalingService) private readonly signalingService: SignalingService
  ) {
    this.subscribeToEvents();
  }

  /**
   * 訂閱所有整合事件
   */
  private subscribeToEvents(): void {
    // 訂閱所有以 'integration.' 開頭的事件
    this.integrationEventBus.subscribeToNamespace('integration.', this.handleEvent.bind(this));
    
    console.log('[CollaborationEventHandler] Subscribed to all integration events');
  }

  /**
   * 處理整合事件並轉發到 WebRTC
   */
  private async handleEvent(event: IntegrationEvent): Promise<void> {
    try {
      const message = {
        type: event.eventType,
        payload: {
          ...event,
          timestamp: event.timestamp,
          eventId: event.eventId
        }
      };

      await this.signalingService.sendMessage(JSON.stringify(message));
      console.log(`[CollaborationEventHandler] Successfully forwarded event ${event.eventType} to WebRTC`);
    } catch (error) {
      console.error(`[CollaborationEventHandler] Error forwarding event to WebRTC:`, error);
      throw error;
    }
  }
} 