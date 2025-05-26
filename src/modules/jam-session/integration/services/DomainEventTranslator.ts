import { injectable, inject } from 'inversify';
import { IntegrationEventBus } from '../../../../core/event-bus/IntegrationEventBus';
import { JamEventBus } from '../../infrastructure/messaging/JamEventBus';
import { SessionStartedIntegrationEvent } from '../events/SessionStartedIntegrationEvent';
import { PlayerUnavailableIntegrationEvent } from '../events/PlayerUnavailableIntegrationEvent';
import { RoundStateChangedIntegrationEvent } from '../events/RoundStateChangedIntegrationEvent';
import { TrackCreatedIntegrationEvent } from '../events/TrackCreatedIntegrationEvent';
import { RoundState } from '../events/RoundStateChangedIntegrationEvent';

/**
 * 領域事件轉換器
 * 負責將領域事件轉換為整合事件
 */
@injectable()
export class DomainEventTranslator {
  constructor(
    @inject('IntegrationEventBus') private integrationEventBus: IntegrationEventBus,
    @inject('JamEventBus') private jamEventBus: JamEventBus
  ) {
    this.setupSubscriptions();
  }

  private setupSubscriptions(): void {
    // 訂閱會話開始事件
    this.jamEventBus.subscribe('jam.session-started', (event: any) => {
      const integrationEvent = SessionStartedIntegrationEvent.fromDomainEvent(
        event.sessionId,
        event.startTime,
        event.roomId || 'unknown',  // 若沒有roomId則使用預設值
        event.initialPlayers || []
      );
      this.integrationEventBus.publish(integrationEvent);
    });

    // 訂閱玩家離開事件
    this.jamEventBus.subscribe('jam.player-unavailable', (event: any) => {
      const integrationEvent = PlayerUnavailableIntegrationEvent.fromDomainEvent(
        event.sessionId,
        event.peerId,
        'player_disconnected'
      );
      this.integrationEventBus.publish(integrationEvent);
    });

    // 訂閱回合開始事件
    this.jamEventBus.subscribe('jam.round-started', (event: any) => {
      const integrationEvent = RoundStateChangedIntegrationEvent.fromRoundStarted(
        event.sessionId,
        event.roundNumber,
        event.startTime,
        event.durationSeconds
      );
      this.integrationEventBus.publish(integrationEvent);
    });

    // 訂閱回合結束事件
    this.jamEventBus.subscribe('jam.round-ended', (event: any) => {
      const integrationEvent = RoundStateChangedIntegrationEvent.fromRoundEnded(
        event.sessionId,
        event.roundNumber,
        event.endTime || new Date(),
        [], // 這裡應該從查詢服務獲取已完成的玩家
        []  // 這裡應該從查詢服務獲取已確認的玩家
      );
      this.integrationEventBus.publish(integrationEvent);
    });

    // 訂閱音軌創建事件
    this.jamEventBus.subscribe('jam.track-created', (event: any) => {
      const integrationEvent = TrackCreatedIntegrationEvent.fromDomainEvent(
        event.sessionId,
        event.roundNumber,
        event.trackId,
        event.playerId
      );
      this.integrationEventBus.publish(integrationEvent);
    });
  }
} 