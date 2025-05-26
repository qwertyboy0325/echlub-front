/**
 * JamSession 模組的標準事件類型常數
 * 根據架構文檔定義的 Integration Events 統一命名約定
 */
export const JamEventTypes = {
  // Session 生命週期事件
  SESSION_CREATED: 'jam.session-created',
  SESSION_STARTED: 'jam.session-started',
  SESSION_ENDED: 'jam.session-ended',
  
  // Player 相關事件
  PLAYER_ADDED: 'jam.player-added',
  PLAYER_ROLE_SET: 'jam.player-role-set',
  PLAYER_READY: 'jam.player-ready',
  PLAYER_LEFT_SESSION: 'jam.player-left-session',
  
  // Round 相關事件
  ROUND_STARTED: 'jam.round-started',
  ROUND_ENDED: 'jam.round-ended',
  ROUND_COMPLETED: 'jam.round-completed',
  NEXT_ROUND_PREPARED: 'jam.next-round-prepared',
  
  // Track 相關事件
  TRACK_CREATED: 'jam.track-created',
  TRACK_ADDED_TO_ROUND: 'jam.track-added-to-round',
  
  // 玩家狀態事件
  PLAYER_COMPLETED_ROUND: 'jam.player-completed-round',
  PLAYER_CONFIRMED_NEXT_ROUND: 'jam.player-confirmed-next-round',
  
  // 系統事件
  COUNTDOWN_TICK: 'jam.countdown-tick'
} as const;

/**
 * 事件類型的 TypeScript 聯合類型
 */
export type JamEventType = typeof JamEventTypes[keyof typeof JamEventTypes];

/**
 * 驗證事件類型是否為有效的 JamSession 事件
 * @param eventType 事件類型字串
 * @returns 是否為有效的 JamSession 事件
 */
export function isValidJamEventType(eventType: string): eventType is JamEventType {
  return Object.values(JamEventTypes).includes(eventType as JamEventType);
} 