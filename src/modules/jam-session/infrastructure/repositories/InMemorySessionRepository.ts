import { injectable } from 'inversify';
import { Session } from '../../domain/aggregates/Session';
import { SessionId } from '../../domain/value-objects/SessionId';
import { SessionRepository } from '../../domain/interfaces/SessionRepository';

/**
 * Session 儲存庫的內存實現
 */
@injectable()
export class InMemorySessionRepository implements SessionRepository {
  private sessions: Map<string, Session> = new Map();
  
  /**
   * 根據 SessionId 查找會話
   * @param sessionId 會話 ID
   * @returns 會話實例或 null
   */
  async findById(sessionId: SessionId): Promise<Session | null> {
    const session = this.sessions.get(sessionId.toString());
    return session || null;
  }
  
  /**
   * 根據房間 ID 查找會話
   * @param roomId 房間 ID
   * @returns 會話實例或 null
   */
  async findByRoomId(roomId: string): Promise<Session | null> {
    for (const session of this.sessions.values()) {
      if (session.roomId === roomId) {
        return session;
      }
    }
    return null;
  }
  
  /**
   * 根據玩家 ID 查找會話
   * @param peerId 玩家 ID
   * @returns 會話實例或 null
   */
  async findByPeerId(peerId: string): Promise<Session | null> {
    for (const session of this.sessions.values()) {
      if (session.players.has(peerId)) {
        return session;
      }
    }
    return null;
  }
  
  /**
   * 保存會話
   * @param session 會話實例
   */
  async save(session: Session): Promise<void> {
    this.sessions.set(session.sessionId.toString(), session);
  }
  
  /**
   * 刪除會話
   * @param sessionId 會話 ID
   */
  async delete(sessionId: SessionId): Promise<void> {
    this.sessions.delete(sessionId.toString());
  }
} 