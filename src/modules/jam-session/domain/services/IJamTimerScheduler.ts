/**
 * JamSession 計時器排程器介面
 */
export interface IJamTimerScheduler {
  /**
   * 排程計時器
   * @param sessionId 會話 ID
   * @param durationSeconds 持續時間（秒）
   * @param callback 計時結束回調
   */
  schedule(sessionId: string, durationSeconds: number, callback: () => void): void;

  /**
   * 取消計時器
   * @param sessionId 會話 ID
   */
  cancel(sessionId: string): void;

  /**
   * 檢查計時器是否存在
   * @param sessionId 會話 ID
   * @returns 是否存在
   */
  exists(sessionId: string): boolean;
} 