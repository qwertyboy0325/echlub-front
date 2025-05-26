export interface JamSessionService {
  updatePlayerRole(sessionId: string, playerId: string, newRole: string): Promise<void>;
  // 其他會話相關的方法...
} 