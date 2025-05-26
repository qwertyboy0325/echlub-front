import { injectable, inject } from 'inversify';
import { IntegrationEventBus } from '../../../../core/event-bus/IntegrationEventBus';
import { JamEventBus } from '../../infrastructure/messaging/JamEventBus';
import { CollaborationEvent } from '../../../collaboration/domain/events/CollaborationEvent';

/**
 * 處理從 Collaboration 模組接收的整合事件
 */
@injectable()
export class CollaborationEventHandler {
  constructor(
    @inject('IntegrationEventBus') private integrationEventBus: IntegrationEventBus,
    @inject('JamEventBus') private jamEventBus: JamEventBus
  ) {
    this.setupSubscriptions();
  }

  private setupSubscriptions(): void {
    // 訂閱 Collaboration 事件
    this.integrationEventBus.subscribe<CollaborationEvent>(
      'CollaborationEvent',
      this.handleCollaborationEvent.bind(this)
    );
  }

  /**
   * 處理 Collaboration 事件並轉發到 JamSession 模組
   */
  private async handleCollaborationEvent(event: CollaborationEvent): Promise<void> {
    // 根據 channel 和事件類型進行處理
    if (event.payload.channel === 'jam-session') {
      const data = event.payload.data;
      
      // 根據事件類型轉換為模組內事件
      if (data.type) {
        await this.jamEventBus.publish(data.type, data);
      }
    }
  }
} 