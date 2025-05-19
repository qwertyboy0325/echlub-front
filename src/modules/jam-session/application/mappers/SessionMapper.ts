import { Session } from '../../domain/aggregates/Session';
import { SessionDto, PlayerDto } from '../types';
import { PlayerState } from '../../domain/entities/PlayerState';

/**
 * 會話映射器
 */
export class SessionMapper {
  /**
   * 將會話實體轉換為 DTO
   * @param session 會話實體
   * @returns 會話 DTO
   */
  static toDto(session: Session): SessionDto {
    const players = Array.from(session.players.entries())
      .map(([peerId, playerState]: [string, PlayerState]): PlayerDto => ({
        peerId,
        role: playerState.role ? {
          id: playerState.role.id,
          name: playerState.role.name,
          color: playerState.role.color
        } : null,
        isReady: playerState.isReady,
        joinedAt: playerState.joinedAt.toISOString()
      }));

    const rounds = session.rounds.map(round => ({
      roundNumber: round.roundNumber,
      startedAt: round.startedAt.toISOString(),
      durationSeconds: round.durationSeconds,
      endedAt: round.endedAt ? round.endedAt.toISOString() : null,
      isActive: !round.isOver()
    }));

    return {
      sessionId: session.sessionId.toString(),
      roomId: session.roomId,
      status: session.status,
      currentRoundNumber: session.currentRoundNumber,
      rounds,
      players
    };
  }
} 