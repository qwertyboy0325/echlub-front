import { injectable, inject } from 'inversify';
import { IntegrationEventBus } from '../../../../core/event-bus/IntegrationEventBus';
import { PlayerRoleChangedEvent } from '../../domain/events/PlayerRoleChangedEvent';
import { JamSessionTypes } from '../../di/JamSessionTypes';
import type { JamSessionService } from '../../domain/services/JamSessionService';

@injectable()
export class PlayerRoleChangedHandler {
  constructor(
    @inject(JamSessionTypes.JamSessionService) private jamSessionService: JamSessionService,
    @inject('IntegrationEventBus') private eventBus: IntegrationEventBus
  ) {
    this.initialize();
  }

  private initialize(): void {
    this.eventBus.subscribe<PlayerRoleChangedEvent>(
      'PlayerRoleChangedEvent',
      this.handlePlayerRoleChanged.bind(this)
    );
  }

  private async handlePlayerRoleChanged(event: PlayerRoleChangedEvent): Promise<void> {
    try {
      await this.jamSessionService.updatePlayerRole(
        event.payload.sessionId,
        event.payload.playerId,
        event.payload.newRole
      );
    } catch (error) {
      console.error('Error handling player role change:', error);
      // 可以在這裡發布錯誤事件或執行其他錯誤處理邏輯
    }
  }
} 