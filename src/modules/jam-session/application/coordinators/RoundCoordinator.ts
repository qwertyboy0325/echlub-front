import { injectable, inject } from 'inversify';
import { RoundEndedEvent } from '../../domain/events/round/RoundEndedEvent';
import { PlayerCompletedRoundEvent } from '../../domain/events/player/PlayerCompletedRoundEvent';
import { PlayerConfirmedNextRoundEvent } from '../../domain/events/player/PlayerConfirmedNextRoundEvent';
import { JamSessionTypes } from '../../di/JamSessionTypes';
import { Round } from '../../domain/aggregates/Round';
import { JamSessionDomainService } from '../../domain/services/JamSessionDomainService';
import type { SessionRepository } from '../../domain/interfaces/SessionRepository';
import type { RoundRepository } from '../../domain/interfaces/RoundRepository';
import type { IJamEventBus } from '../../domain/interfaces/IJamEventBus';
import { DomainEventDispatcher } from '../../../../core/events/DomainEventDispatcher';
import { SessionStatus } from '../../domain/aggregates/Session';
import { BaseCoordinator } from './BaseCoordinator';

/**
 * Round 應用層協調器
 * 負責管理回合內操作、音軌管理和回合完成邏輯
 */
@injectable()
export class RoundCoordinator extends BaseCoordinator {
  private readonly MAX_ROUNDS = 5; // 預設最大回合數，可從配置中加載

  constructor(
    @inject(JamSessionTypes.SessionRepository) private readonly sessionRepository: SessionRepository,
    @inject(JamSessionTypes.RoundRepository) private readonly roundRepository: RoundRepository,
    @inject(JamSessionTypes.JamEventBus) eventBus: IJamEventBus
  ) {
    super(eventBus);
    this.setupEventHandlers();
  }

  /**
   * 設置事件處理器
   */
  protected setupEventHandlers(): void {
    // 監聽回合相關事件
    this.eventBus.subscribe('jam.round-ended', this.handleRoundEnded.bind(this));
    this.eventBus.subscribe('jam.player-completed-round', this.handlePlayerCompletedRound.bind(this));
    this.eventBus.subscribe('jam.player-confirmed-next-round', this.handlePlayerConfirmedNextRound.bind(this));
  }

  /**
   * 處理回合結束事件
   * @param event 回合結束事件
   */
  private async handleRoundEnded(event: RoundEndedEvent): Promise<void> {
    try {
      const round = await this.roundRepository.findById(event.roundId);
      this.validateExists(round, 'Round', event.roundId);

      const session = await this.sessionRepository.findById(event.sessionId);
      this.validateExists(session, 'Session', event.sessionId);

      await this.executeDomainOperation(async () => {
        // 使用領域服務處理回合結束
        this.domainService.handleRoundEnded(session, round);

        // 保存並發布事件
        await this.sessionRepository.save(session);
        await this.dispatchSessionEvents(session);
      }, 'Failed to handle round ended');
    } catch (error) {
      this.handleEventError('round-ended', error);
    }
  }

  /**
   * 處理玩家完成回合事件
   * @param event 玩家完成回合事件
   */
  private async handlePlayerCompletedRound(event: PlayerCompletedRoundEvent): Promise<void> {
    try {
      const session = await this.sessionRepository.findById(event.sessionId);
      this.validateExists(session, 'Session', event.sessionId);
      
      if (!session.currentRoundId) {
        throw new Error(`No active round in session: ${event.sessionId}`);
      }

      const round = await this.roundRepository.findById(session.currentRoundId.toString());
      this.validateExists(round, 'Round', session.currentRoundId.toString());

      await this.executeDomainOperation(async () => {
        // 將領域事件傳遞給領域服務
        this.domainService.processDomainEvents([event]);
        
        // 檢查是否所有玩家都完成了回合
        if (this.domainService.shouldEndRound(session, round)) {
          round.end();
          await this.roundRepository.save(round);
          await this.dispatchRoundEvents(round);
        }
      }, 'Failed to handle player completed round');
    } catch (error) {
      this.handleEventError('player-completed-round', error);
    }
  }

  /**
   * 處理玩家確認下一回合事件
   * @param event 玩家確認下一回合事件
   */
  private async handlePlayerConfirmedNextRound(event: PlayerConfirmedNextRoundEvent): Promise<void> {
    try {
      const round = await this.roundRepository.findById(event.roundId);
      this.validateExists(round, 'Round', event.roundId);

      const session = await this.sessionRepository.findById(event.sessionId);
      this.validateExists(session, 'Session', event.sessionId);

      await this.executeDomainOperation(async () => {
        // 將領域事件傳遞給領域服務
        this.domainService.processDomainEvents([event]);
        
        // 檢查是否所有玩家都確認了下一回合
        if (this.domainService.shouldPrepareNextRound(session, round)) {
          // 準備下一回合
          const nextRoundNumber = this.domainService.prepareNextRound(session);
          
          // 檢查是否達到最大回合數
          if (this.domainService.isLastRound(session, this.MAX_ROUNDS)) {
            session.endJamSession();
          } else {
            // 創建新回合
            const newRound = this.domainService.createRound(session);
            await this.roundRepository.save(newRound);
            await this.dispatchRoundEvents(newRound);
          }
          
          // 保存會話
          await this.sessionRepository.save(session);
          await this.dispatchSessionEvents(session);
        }
      }, 'Failed to handle player confirmed next round');
    } catch (error) {
      this.handleEventError('player-confirmed-next-round', error);
    }
  }

  /**
   * 開始新回合
   * @param sessionId 會話 ID
   * @param durationSeconds 回合持續時間（秒）
   */
  async startNewRound(sessionId: string, durationSeconds: number): Promise<void> {
    await this.executeDomainOperation(async () => {
      const session = await this.sessionRepository.findById(sessionId);
      this.validateExists(session, 'Session', sessionId);

      // 使用領域服務創建新回合
      const round = this.domainService.createRound(session, durationSeconds);
      
      // 保存並發布事件
      await this.roundRepository.save(round);
      await this.dispatchRoundEvents(round);
      await this.dispatchSessionEvents(session);
      
      // 保存會話
      await this.sessionRepository.save(session);
    }, 'Failed to start new round');
  }

  /**
   * 結束當前回合
   * @param sessionId 會話 ID
   */
  async endCurrentRound(sessionId: string): Promise<void> {
    await this.executeDomainOperation(async () => {
      const session = await this.sessionRepository.findById(sessionId);
      this.validateExists(session, 'Session', sessionId);

      // 檢查當前回合
      if (!session.currentRoundId) {
        throw new Error('No active round to end');
      }
      
      const round = await this.roundRepository.findById(session.currentRoundId.toString());
      this.validateExists(round, 'Round', session.currentRoundId.toString());
      
      // 結束回合
      round.end();
      
      // 標記會話回合已完成
      session.markRoundCompleted(session.currentRoundId);
      
      // 保存並發布事件
      await this.roundRepository.save(round);
      await this.sessionRepository.save(session);
      await this.dispatchRoundEvents(round);
      await this.dispatchSessionEvents(session);
    }, 'Failed to end current round');
  }

  /**
   * 添加音軌到當前回合
   * @param sessionId 會話 ID
   * @param trackId 音軌 ID
   * @param playerId 玩家 ID
   */
  async addTrackToRound(sessionId: string, trackId: string, playerId: string): Promise<void> {
    await this.executeDomainOperation(async () => {
      const session = await this.sessionRepository.findById(sessionId);
      this.validateExists(session, 'Session', sessionId);

      // 檢查當前回合
      if (!session.currentRoundId) {
        throw new Error('No active round');
      }
      
      const round = await this.roundRepository.findById(session.currentRoundId.toString());
      this.validateExists(round, 'Round', session.currentRoundId.toString());
      
      // 添加音軌
      round.addTrack(trackId, playerId);
      
      // 保存並發布事件
      await this.roundRepository.save(round);
      await this.dispatchRoundEvents(round);
    }, 'Failed to add track to round');
  }

  /**
   * 標記玩家完成回合
   * @param sessionId 會話 ID
   * @param playerId 玩家 ID
   */
  async markPlayerRoundCompletion(sessionId: string, playerId: string): Promise<void> {
    await this.executeDomainOperation(async () => {
      const session = await this.sessionRepository.findById(sessionId);
      this.validateExists(session, 'Session', sessionId);

      // 檢查當前回合
      if (!session.currentRoundId) {
        throw new Error('No active round');
      }
      
      const round = await this.roundRepository.findById(session.currentRoundId.toString());
      this.validateExists(round, 'Round', session.currentRoundId.toString());
      
      // 標記玩家完成回合
      round.markPlayerCompleted(playerId);
      
      // 保存並發布事件
      await this.roundRepository.save(round);
      await this.dispatchRoundEvents(round);
    }, 'Failed to mark player round completion');
  }

  /**
   * 確認下一回合
   * @param sessionId 會話 ID
   * @param playerId 玩家 ID
   * @param roundId 回合 ID
   */
  async confirmNextRound(sessionId: string, playerId: string, roundId: string): Promise<void> {
    await this.executeDomainOperation(async () => {
      const session = await this.sessionRepository.findById(sessionId);
      this.validateExists(session, 'Session', sessionId);

      const round = await this.roundRepository.findById(roundId);
      this.validateExists(round, 'Round', roundId);
      
      // 確認下一回合
      round.confirmNextRound(playerId);
      
      // 保存並發布事件
      await this.roundRepository.save(round);
      await this.dispatchRoundEvents(round);
    }, 'Failed to confirm next round');
  }
} 