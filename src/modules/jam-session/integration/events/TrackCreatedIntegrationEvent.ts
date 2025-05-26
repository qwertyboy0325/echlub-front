import { IntegrationEvent } from '../../../../core/event-bus/IntegrationEvent';

export interface TrackCreatedPayload {
  sessionId: string;
  roundNumber: number;
  trackId: string;
  playerId: string;
  metadata?: {
    duration?: number;
    format?: string;
    size?: number;
    name?: string;
  };
  timestamp: Date;
}

export class TrackCreatedIntegrationEvent extends IntegrationEvent {
  constructor(public readonly payload: TrackCreatedPayload) {
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
    trackId: string,
    playerId: string,
    metadata?: TrackCreatedPayload['metadata']
  ): TrackCreatedIntegrationEvent {
    return new TrackCreatedIntegrationEvent({
      sessionId,
      roundNumber,
      trackId,
      playerId,
      metadata,
      timestamp: new Date()
    });
  }
} 