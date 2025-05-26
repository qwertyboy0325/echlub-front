import { IntegrationEvent } from '../../../../core/event-bus/IntegrationEvent';

export enum RoundState {
  STARTED = 'started',
  ENDED = 'ended'
}

export interface RoundStateChangedPayload {
  sessionId: string;
  roundNumber: number;
  state: RoundState;
  timestamp: Date;
  durationSeconds?: number;
  completedPlayers?: string[];
  confirmedPlayers?: string[];
}

export class RoundStateChangedIntegrationEvent extends IntegrationEvent {
  constructor(public readonly payload: RoundStateChangedPayload) {
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

  static fromRoundStarted(
    sessionId: string,
    roundNumber: number,
    startTime: Date,
    durationSeconds: number
  ): RoundStateChangedIntegrationEvent {
    return new RoundStateChangedIntegrationEvent({
      sessionId,
      roundNumber,
      state: RoundState.STARTED,
      timestamp: startTime,
      durationSeconds,
      completedPlayers: [],
      confirmedPlayers: []
    });
  }

  static fromRoundEnded(
    sessionId: string,
    roundNumber: number,
    endTime: Date,
    completedPlayers: string[],
    confirmedPlayers: string[]
  ): RoundStateChangedIntegrationEvent {
    return new RoundStateChangedIntegrationEvent({
      sessionId,
      roundNumber,
      state: RoundState.ENDED,
      timestamp: endTime,
      completedPlayers,
      confirmedPlayers
    });
  }
} 