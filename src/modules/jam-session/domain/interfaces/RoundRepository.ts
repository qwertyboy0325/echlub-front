import { Round } from '../aggregates/Round';

/**
 * 回合倉儲介面
 */
export interface RoundRepository {
  /**
   * 根據 ID 查詢回合
   */
  findById(id: string): Promise<Round | null>;
  
  /**
   * 保存回合
   */
  save(round: Round): Promise<void>;
  
  /**
   * 根據會話 ID 查詢所有回合
   */
  findBySessionId(sessionId: string): Promise<Round[]>;
  
  /**
   * 根據會話 ID 和回合編號查詢回合
   */
  findBySessionIdAndRoundNumber(sessionId: string, roundNumber: number): Promise<Round | null>;
} 