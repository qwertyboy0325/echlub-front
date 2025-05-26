/**
 * 整合事件基礎類別
 */
export abstract class IntegrationEvent {
  public readonly timestamp: string;
  public readonly eventId: string;

  constructor() {
    this.timestamp = new Date().toISOString();
    this.eventId = crypto.randomUUID();
  }

  abstract get eventType(): string;
} 