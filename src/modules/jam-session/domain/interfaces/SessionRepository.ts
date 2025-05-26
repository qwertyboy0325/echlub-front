import { Session } from '../aggregates/Session';
import { SessionId } from '../value-objects/SessionId';

/**
 * 會話儲存庫介面
 */
export interface SessionRepository {
  /**
   * 根據 ID 查詢會話
   * @param id 會話 ID (可以是字串或 SessionId 物件)
   */
  findById(id: string | SessionId): Promise<Session | null>;
  
  /**
   * 保存會話
   * @param session 會話實體
   */
  save(session: Session): Promise<void>;
  
  /**
   * 刪除會話
   * @param sessionId 會話 ID
   */
  delete(sessionId: string | SessionId): Promise<void>;
  
  /**
   * 根據房間 ID 查詢會話
   * @param roomId 房間 ID
   */
  findByRoomId(roomId: string): Promise<Session | null>;
  
  /**
   * 查找房間中當前的會話
   * @param roomId 房間 ID
   */
  findCurrentSessionInRoom(roomId: string): Promise<Session | null>;
  
  /**
   * 根據玩家 ID 查詢所有會話
   * @param peerId 玩家 ID
   */
  findByPlayerId(peerId: string): Promise<Session[]>;
} 