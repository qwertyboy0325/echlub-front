import { IntegrationEvent as NewIntegrationEvent } from '../events/IntegrationEvent';

/**
 * @deprecated 此檔案已被棄用，請使用 @/core/events/IntegrationEvent 代替
 */
export abstract class IntegrationEvent extends NewIntegrationEvent {
  /**
   * @deprecated 請使用 eventId 代替
   */
  get id(): string {
    return this.eventId;
  }

  /**
   * @deprecated 請使用 eventType 代替
   */
  get type(): string {
    return this.eventType;
  }

  /**
   * @deprecated 請直接使用 timestamp 屬性
   */
  get timestampDate(): Date {
    return new Date(this.timestamp);
  }

  /**
   * @deprecated 舊版實作要求定義 toJSON 方法
   */
  toJSON(): Record<string, unknown> {
    return {
      id: this.eventId,
      type: this.eventType,
      timestamp: this.timestamp
    };
  }
} 