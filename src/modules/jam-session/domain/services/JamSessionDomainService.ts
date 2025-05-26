import { Session } from '../aggregates/Session';
import { Round } from '../aggregates/Round';
import { RoundId } from '../value-objects/RoundId';
import { DomainEventProcessor, DomainEventHandler } from './DomainEventProcessor';
import { RoundEndedEvent } from '../events/round/RoundEndedEvent';
import { RoundCompletedEvent } from '../events/round/RoundCompletedEvent';
import { PlayerCompletedRoundEvent } from '../events/player/PlayerCompletedRoundEvent';
import { PlayerConfirmedNextRoundEvent } from '../events/player/PlayerConfirmedNextRoundEvent';
import { DomainEvent } from '@/core/events/DomainEvent';

/**
 * JamSession 領域服務
 * 負責協調 Session 和 Round 聚合根之間的核心領域邏輯互動
 */
export class JamSessionDomainService {
  private eventProcessor: DomainEventProcessor;
  // 保存當前處理的會話和回合
  private sessionMap: Map<string, Session> = new Map();
  private roundMap: Map<string, Round> = new Map();

  constructor() {
    this.eventProcessor = new DomainEventProcessor();
    this.setupEventHandlers();
  }

  /**
   * 設置事件處理器
   * 註冊領域內部事件處理
   */
  private setupEventHandlers(): void {
    // 當回合結束時，更新會話狀態
    this.eventProcessor.register<RoundEndedEvent>(
      'jam.round-ended',
      this.onRoundEnded.bind(this)
    );

    // 當玩家完成回合時，檢查是否所有玩家都完成了
    this.eventProcessor.register<PlayerCompletedRoundEvent>(
      'jam.player-completed-round',
      this.onPlayerCompletedRound.bind(this)
    );

    // 當玩家確認下一回合時，檢查是否所有玩家都確認了
    this.eventProcessor.register<PlayerConfirmedNextRoundEvent>(
      'jam.player-confirmed-next-round',
      this.onPlayerConfirmedNextRound.bind(this)
    );
  }

  /**
   * 處理領域事件 - 用於內部事件處理器
   */
  private onRoundEnded(event: RoundEndedEvent): void {
    // 純領域邏輯處理，日誌記錄
    console.log(`[Domain] Round ended: ${event.roundId}`);
  }

  /**
   * 處理玩家完成回合事件 - 用於內部事件處理器
   */
  private onPlayerCompletedRound(event: PlayerCompletedRoundEvent): void {
    console.log(`[Domain] Player ${event.peerId} completed round ${event.roundNumber}`);
  }

  /**
   * 處理玩家確認下一回合事件 - 用於內部事件處理器
   */
  private onPlayerConfirmedNextRound(event: PlayerConfirmedNextRoundEvent): void {
    console.log(`[Domain] Player ${event.playerId} confirmed next round`);
  }

  /**
   * 處理領域事件
   * 將聚合根產生的事件傳遞給領域事件處理器
   * @param events 領域事件列表
   */
  public processDomainEvents(events: DomainEvent[]): void {
    this.eventProcessor.processEvents(events);
  }

  /**
   * 註冊會話和回合以供內部事件處理使用
   * 應用層協調器應該在獲取聚合根後調用此方法
   */
  public registerAggregates(session: Session, round: Round): void {
    this.sessionMap.set(session.sessionId.toString(), session);
    this.roundMap.set(round.id.toString(), round);
  }

  /**
   * 清除註冊的聚合根
   * 應用層協調器應該在完成處理後調用此方法
   */
  public clearAggregates(sessionId: string, roundId: string): void {
    this.sessionMap.delete(sessionId);
    this.roundMap.delete(roundId);
  }

  /**
   * 處理回合結束
   * 用於應用層直接調用，更新會話狀態
   */
  public handleRoundEnded(session: Session, round: Round): void {
    session.markRoundCompleted(round.id);
  }
  
  /**
   * 檢查回合是否應該結束
   * 根據所有玩家的完成情況決定
   */
  public shouldEndRound(session: Session, round: Round): boolean {
    return round.areAllPlayersCompleted(session.playerIds);
  }
  
  /**
   * 檢查是否應該準備下一回合
   * 根據所有玩家的確認情況決定
   */
  public shouldPrepareNextRound(session: Session, round: Round): boolean {
    return round.areAllPlayersConfirmed(session.playerIds);
  }
  
  /**
   * 準備下一回合
   * 更新會話狀態並獲取下一回合號碼
   */
  public prepareNextRound(session: Session): number {
    return session.prepareNextRound();
  }
  
  /**
   * 創建新回合
   * 創建新的回合聚合根並更新會話狀態
   */
  public createRound(session: Session, durationSeconds: number = 120): Round {
    // 檢查會話狀態
    if (session.status !== 'inProgress') {
      throw new Error('Cannot create round when session is not in progress');
    }

    // 創建新回合
    const nextRoundNumber = session.currentRoundNumber + 1;
    const round = Round.create(
      session.sessionId.toString(),
      nextRoundNumber,
      durationSeconds
    );
    
    // 更新會話的當前回合
    session.setCurrentRound(round.id, nextRoundNumber);
    
    return round;
  }
  
  /**
   * 檢查會話是否已完成最後回合
   * 根據會話配置和當前回合號碼決定
   */
  public isLastRound(session: Session, maxRounds: number): boolean {
    return session.currentRoundNumber >= maxRounds;
  }
  
  /**
   * 結束會話
   * 如果是最後一個回合或符合其他結束條件
   */
  public endJamSessionIfNeeded(session: Session, maxRounds: number): boolean {
    if (this.isLastRound(session, maxRounds)) {
      session.endJamSession();
      return true;
    }
    return false;
  }
} 