import { injectable, inject } from 'inversify';
import type { IEventBus } from '../event-bus/IEventBus';
import { TYPES } from '../di/types';

/**
 * 事件監控器，用於監控系統中的事件流
 */
@injectable()
export class EventMonitor {
  constructor(
    @inject(TYPES.EventBus) private eventBus: IEventBus,
    @inject(TYPES.Logger) private logger: any
  ) {}

  /**
   * 啟用事件監控
   */
  public enableMonitoring(): void {
    this.logger.info('EventMonitor: Event monitoring enabled');
    this.eventBus.on('*', this.handleEvent.bind(this));
  }

  /**
   * 處理所有事件
   */
  private handleEvent(event: any): void {
    this.logger.debug(`EventMonitor: Event received - ${event.eventType || 'unknown'}`, event);
  }
} 
