import { IntegrationEvent } from '../../../../core/event-bus/IntegrationEvent';

export interface RoundStartedPayload {
  sessionId: string;
  roundNumber: number;
  startTime: Date;
  durationSeconds: number;
}

/**
 * 回合開始整合事件
 * 當新回合開始時發布
 */
export class RoundStartedIntegrationEvent extends IntegrationEvent {
  constructor(public readonly payload: RoundStartedPayload) {
    super();
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      timestamp: this.timestamp,
      type: this.type,
      payload: this.payload
    };
  }

  static fromDomainEvent(
    sessionId: string,
    roundNumber: number,
    startTime: Date,
    durationSeconds: number
  ): RoundStartedIntegrationEvent {
    return new RoundStartedIntegrationEvent({
      sessionId,
      roundNumber,
      startTime,
      durationSeconds
    });
  }
} 