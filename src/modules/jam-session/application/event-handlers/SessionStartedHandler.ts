import { injectable, inject } from 'inversify';
import { CoreTypes } from '@/core/di/CoreTypes';
import type { IntegrationEventBus } from '@/core/events/IntegrationEventBus';
import type { JamSessionStartedEvent } from '../../domain/events/session/JamSessionStartedEvent';
import { SessionStartedIntegrationEvent } from '../../integration/events';

/**
 * 處理會話開始事件
 */
@injectable()
export class SessionStartedHandler {
  constructor(
    @inject(CoreTypes.IntegrationEventBus) private readonly integrationEventBus: IntegrationEventBus
  ) {}

  /**
   * 處理會話開始事件
   */
  async handle(event: JamSessionStartedEvent): Promise<void> {
    console.log(`[SessionStartedHandler] Processing session start event for session ${event.sessionId}`);

    try {
      // 建立整合事件
      const integrationEvent = new SessionStartedIntegrationEvent({
        sessionId: event.sessionId,
        startTime: event.startTime,
        roomId: '', // 從 Session 聚合根獲取
        players: event.initialPlayers.map(player => ({
          peerId: player.peerId,
          role: player.role?.name || null,
          isReady: player.isReady
        }))
      });

      // 發布整合事件
      await this.integrationEventBus.publish(integrationEvent);
      
      console.log(`[SessionStartedHandler] Successfully published session start integration event`);
    } catch (error) {
      console.error(`[SessionStartedHandler] Error processing session start event:`, error);
      throw error;
    }
  }
} 