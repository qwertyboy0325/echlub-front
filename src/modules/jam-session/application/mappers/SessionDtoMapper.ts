import { injectable } from 'inversify';
import type { Session } from '../../domain/aggregates/Session';
import type { SessionDto } from '../types';

/**
 * Session DTO 轉換器
 */
@injectable()
export class SessionDtoMapper {
  /**
   * 將 Session 實體轉換為 DTO
   * @param session Session 實體
   */
  toDto(session: Session): SessionDto {
    return {
      sessionId: session.sessionId.toString(),
      roomId: session.roomId,
      status: session.status,
      currentRoundNumber: session.currentRoundNumber,
      players: Array.from(session.players.entries()).map(([peerId, state]) => ({
        peerId,
        role: state.role ? {
          id: state.role.id,
          name: state.role.name,
          color: state.role.color
        } : null,
        isReady: state.isReady,
        joinedAt: state.joinedAt.toISOString()
      })),
      rounds: session.rounds.map(round => ({
        roundNumber: round.roundNumber,
        startedAt: round.startedAt.toISOString(),
        durationSeconds: round.durationSeconds,
        endedAt: round.endedAt?.toISOString() ?? null,
        isActive: !round.isOver()
      }))
    };
  }
} 