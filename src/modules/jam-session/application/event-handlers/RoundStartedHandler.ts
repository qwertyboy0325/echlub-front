import { injectable, inject } from 'inversify';
import { CoreTypes } from '@/core/di/CoreTypes';
import type { IntegrationEventBus } from '@/core/events/IntegrationEventBus';
import type { NextRoundStartedEvent } from '../../domain/events/round/NextRoundStartedEvent';
import { RoundStartedIntegrationEvent } from '../../integration/events';

/**
 * 處理回合開始事件
 */
@injectable()
export class RoundStartedHandler {
  constructor(
    @inject(CoreTypes.IntegrationEventBus) private readonly integrationEventBus: IntegrationEventBus
  ) {}

  /**
   * 處理回合開始事件
   */
  async handle(event: NextRoundStartedEvent): Promise<void> {
    console.log(`[RoundStartedHandler] Processing round start event for session ${event.sessionId}, round ${event.roundNumber}`);

    try {
      // 建立整合事件
      const integrationEvent = new RoundStartedIntegrationEvent({
        sessionId: event.sessionId,
        roundNumber: event.roundNumber,
        startTime: event.startTime,
        durationSeconds: event.durationSeconds
      });

      // 發布整合事件
      await this.integrationEventBus.publish(integrationEvent);
      
      console.log(`[RoundStartedHandler] Successfully published round start integration event for round ${event.roundNumber}`);
    } catch (error) {
      console.error(`[RoundStartedHandler] Error processing round start event:`, error);
      throw error;
    }
  }
} 