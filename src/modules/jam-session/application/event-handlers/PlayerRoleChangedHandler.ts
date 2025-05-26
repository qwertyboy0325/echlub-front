import { injectable, inject } from 'inversify';
import { CoreTypes } from '@/core/di/CoreTypes';
import type { IntegrationEventBus } from '@/core/events/IntegrationEventBus';
import type { PlayerRoleSetEvent } from '../../domain/events/player/PlayerRoleSetEvent';
import { PlayerRoleChangedIntegrationEvent } from '../../integration/events';

/**
 * 處理玩家角色變更事件
 */
@injectable()
export class PlayerRoleChangedHandler {
  constructor(
    @inject(CoreTypes.IntegrationEventBus) private readonly integrationEventBus: IntegrationEventBus
  ) {}

  /**
   * 處理玩家角色設定事件
   */
  async handle(event: PlayerRoleSetEvent): Promise<void> {
    console.log(`[PlayerRoleChangedHandler] Processing role change for player ${event.peerId} in session ${event.sessionId}`);

    try {
      // 建立整合事件
      const integrationEvent = PlayerRoleChangedIntegrationEvent.fromDomainEvent(
        event.sessionId,
        event.peerId,
        event.role
      );

      // 發布整合事件
      await this.integrationEventBus.publish(integrationEvent);
      
      console.log(`[PlayerRoleChangedHandler] Successfully published role change integration event for player ${event.peerId}`);
    } catch (error) {
      console.error(`[PlayerRoleChangedHandler] Error processing role change event:`, error);
      throw error;
    }
  }
} 