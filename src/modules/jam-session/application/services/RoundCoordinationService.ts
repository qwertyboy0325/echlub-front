import { injectable, inject } from 'inversify';
import { Session, SessionStatus } from '../../domain/aggregates/Session';
import { Round } from '../../domain/aggregates/Round';
import { JamEventBus } from '../../infrastructure/messaging/JamEventBus';
import { JamSessionTypes } from '../../di/JamSessionTypes';
import { RoundId } from '../../domain/value-objects/RoundId';

/**
 * JamSession Repository Interface
 */
interface JamSessionRepository {
  findById(id: string): Promise<Session | null>;
  save(session: Session): Promise<void>;
}

/**
 * Round Repository Interface
 */
interface RoundRepository {
  findById(id: string): Promise<Round | null>;
  findBySessionId(sessionId: string): Promise<Round[]>;
  save(round: Round): Promise<void>;
}

/**
 * RoundCoordinationService 用於協調 Session 和 Round 聚合根之間的交互
 * This is an application service for coordinating Session and Round aggregates
 */
@injectable()
export class RoundCoordinationService {
  constructor(
    @inject(JamSessionTypes.SessionRepository) private sessionRepository: JamSessionRepository,
    @inject(JamSessionTypes.RoundRepository) private roundRepository: RoundRepository,
    @inject(JamSessionTypes.JamEventBus) private eventBus: JamEventBus
  ) {}

  /**
   * 開始新回合
   */
  async startNewRound(sessionId: string, durationSeconds: number): Promise<void> {
    // 1. 獲取會話
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // 2. 檢查會話狀態
    if (session.status !== SessionStatus.ROUND_COMPLETION && session.currentRoundNumber !== 0) {
      throw new Error("Session is not ready for a new round");
    }

    // 3. 準備下一回合
    const roundNumber = session.currentRoundNumber === 0 ? 1 : session.prepareNextRound();

    // 4. 創建新的 Round 聚合根
    const round = Round.create(
      session.sessionId.toString(),
      roundNumber,
      durationSeconds
    );

    // 5. 保存 Round 聚合根
    await this.roundRepository.save(round);

    // 6. 更新 Session 聚合根
    session.setCurrentRound(round.id, roundNumber);
    await this.sessionRepository.save(session);

    // 7. 獲取領域事件
    const sessionEvents = session.getDomainEvents();
    session.clearDomainEvents();
    const roundEvents = round.collectDomainEvents();

    // 8. 發布所有事件
    for (const event of [...sessionEvents, ...roundEvents]) {
      await this.eventBus.publish(event.eventName, event);
    }
  }

  /**
   * 添加音軌到當前回合
   */
  async addTrackToCurrentRound(sessionId: string, trackId: string, playerId: string): Promise<void> {
    // 1. 獲取會話
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // 2. 檢查會話狀態
    if (session.status !== SessionStatus.IN_PROGRESS) {
      throw new Error("Session is not in progress");
    }

    // 3. 檢查是否有當前回合
    if (!session.currentRoundId) {
      throw new Error("No active round");
    }

    // 4. 獲取當前回合
    const round = await this.roundRepository.findById(session.currentRoundId.toString());
    if (!round) {
      throw new Error("Active round not found");
    }

    // 5. 檢查玩家是否在會話中
    if (!session.players.has(playerId)) {
      throw new Error("Player not found in session");
    }

    // 6. 添加音軌到回合
    round.addTrack(trackId, playerId);

    // 7. 保存回合
    await this.roundRepository.save(round);

    // 8. 發布領域事件
    const roundEvents = round.collectDomainEvents();

    // 9. 發布所有事件
    for (const event of roundEvents) {
      await this.eventBus.publish(event.eventName, event);
    }
  }

  /**
   * 標記玩家完成當前回合
   */
  async markPlayerRoundCompletion(sessionId: string, playerId: string): Promise<void> {
    // 1. 獲取會話
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // 2. 檢查會話狀態
    if (session.status !== SessionStatus.IN_PROGRESS) {
      throw new Error("Session is not in progress");
    }

    // 3. 檢查是否有當前回合
    if (!session.currentRoundId) {
      throw new Error("No active round");
    }

    // 4. 獲取當前回合
    const round = await this.roundRepository.findById(session.currentRoundId.toString());
    if (!round) {
      throw new Error("Active round not found");
    }

    // 5. 標記玩家完成回合
    round.markPlayerCompleted(playerId);

    // 6. 檢查是否所有玩家都完成了
    if (round.areAllPlayersCompleted(session.playerIds)) {
      round.end();
      session.markRoundCompleted(round.id);
      await this.sessionRepository.save(session);
    }

    // 7. 保存回合
    await this.roundRepository.save(round);

    // 8. 獲取領域事件
    const roundEvents = round.collectDomainEvents();
    const sessionEvents = session.getDomainEvents();
    session.clearDomainEvents();

    // 9. 發布所有事件
    for (const event of [...roundEvents, ...sessionEvents]) {
      await this.eventBus.publish(event.eventName, event);
    }
  }

  /**
   * 確認玩家進入下一回合
   */
  async confirmNextRound(sessionId: string, playerId: string): Promise<void> {
    // 1. 獲取會話
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // 2. 檢查會話狀態
    if (session.status !== SessionStatus.ROUND_COMPLETION) {
      throw new Error("Session is not in round completion phase");
    }

    // 3. 檢查是否有當前回合
    if (!session.currentRoundId) {
      throw new Error("No active round");
    }

    // 4. 獲取當前回合
    const round = await this.roundRepository.findById(session.currentRoundId.toString());
    if (!round) {
      throw new Error("Active round not found");
    }

    // 5. 確認玩家進入下一回合
    round.confirmNextRound(playerId);

    // 6. 保存回合
    await this.roundRepository.save(round);

    // 7. 發布領域事件
    const roundEvents = round.collectDomainEvents();

    // 8. 發布所有事件
    for (const event of roundEvents) {
      await this.eventBus.publish(event.eventName, event);
    }
  }

  /**
   * 獲取回合中的所有音軌
   */
  async getTracksForRound(sessionId: string, roundNumber: number): Promise<any[]> {
    // 1. 獲取會話
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // 2. 獲取所有回合
    const rounds = await this.roundRepository.findBySessionId(sessionId);
    
    // 3. 找到指定回合
    const round = rounds.find((r: Round) => r.roundNumber === roundNumber);
    if (!round) {
      return [];
    }
    
    // 4. 獲取回合中的所有音軌
    return round.getAllTracks();
  }

  /**
   * 獲取玩家在回合中的音軌
   */
  async getPlayerTracksForRound(sessionId: string, playerId: string, roundNumber: number): Promise<any[]> {
    // 1. 獲取會話
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // 2. 獲取所有回合
    const rounds = await this.roundRepository.findBySessionId(sessionId);
    
    // 3. 找到指定回合
    const round = rounds.find((r: Round) => r.roundNumber === roundNumber);
    if (!round) {
      return [];
    }
    
    // 4. 獲取玩家在回合中的音軌
    return round.getTracksForPlayer(playerId);
  }
} 