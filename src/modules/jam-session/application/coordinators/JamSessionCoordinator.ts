import { injectable, inject } from 'inversify';
import { RoundEndedEvent } from '../../domain/events/round/RoundEndedEvent';
import { PlayerCompletedRoundEvent } from '../../domain/events/player/PlayerCompletedRoundEvent';
import { PlayerConfirmedNextRoundEvent } from '../../domain/events/player/PlayerConfirmedNextRoundEvent';
import { JamSessionTypes } from '../../di/JamSessionTypes';
import { RoundId } from '../../domain/value-objects/RoundId';
import { Session } from '../../domain/aggregates/Session';
import { Round } from '../../domain/aggregates/Round';
import { JamSessionDomainService } from '../../domain/services/JamSessionDomainService';
import type { SessionRepository } from '../../domain/interfaces/SessionRepository';
import type { RoundRepository } from '../../domain/interfaces/RoundRepository';
import type { IJamEventBus } from '../../domain/interfaces/IJamEventBus';
import { DomainEventDispatcher } from '../../../../core/events/DomainEventDispatcher';
import { BaseCoordinator } from './BaseCoordinator';

/**
 * JamSession 應用層協調器
 * 負責協調 Session 和 Round 聚合根間的互動、事件處理及基礎設施交互
 */
@injectable()
export class JamSessionCoordinator extends BaseCoordinator {
  private domainService: JamSessionDomainService;
  private readonly MAX_ROUNDS = 5; // 預設最大回合數，可從配置中加載

  constructor(
    @inject(JamSessionTypes.SessionRepository) private sessionRepository: SessionRepository,
    @inject(JamSessionTypes.RoundRepository) private roundRepository: RoundRepository,
    @inject(JamSessionTypes.JamEventBus) eventBus: IJamEventBus
  ) {
    super(eventBus);
    this.domainService = new JamSessionDomainService();
    this.setupEventHandlers();
  }

  /**
   * 設置事件處理器
   */
  protected setupEventHandlers(): void {
    // 監聽回合結束事件
    this.eventBus.subscribe('jam.round-ended', this.handleRoundEnded.bind(this));
    
    // 監聽玩家完成回合事件
    this.eventBus.subscribe('jam.player-completed-round', this.handlePlayerCompletedRound.bind(this));
    
    // 監聽玩家確認下一回合事件
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

      // 使用領域服務處理回合結束
      this.domainService.handleRoundEnded(session, round);

      // 保存並發布事件
      await this.executeDomainOperation(async () => {
        await this.sessionRepository.save(session);
        await this.dispatchEvents(session);
      }, 'Failed to process round ended');
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

      // 將領域事件傳遞給領域服務
      this.domainService.processDomainEvents([event]);
      
      // 檢查是否所有玩家都完成了回合
      if (this.domainService.shouldEndRound(session, round)) {
        await this.executeDomainOperation(async () => {
          round.end();
          await this.roundRepository.save(round);
          await this.dispatchEvents(round);
        }, 'Failed to end round');
      }
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

      // 將領域事件傳遞給領域服務
      this.domainService.processDomainEvents([event]);
      
      // 檢查是否所有玩家都確認了下一回合
      if (this.domainService.shouldPrepareNextRound(session, round)) {
        await this.executeDomainOperation(async () => {
          // 準備下一回合
          const nextRoundNumber = this.domainService.prepareNextRound(session);
          
          // 檢查是否達到最大回合數
          if (this.domainService.isLastRound(session, this.MAX_ROUNDS)) {
            session.endJamSession();
          } else {
            // 創建新回合
            const newRound = this.domainService.createRound(session);
            await this.roundRepository.save(newRound);
            await this.dispatchEvents(newRound);
          }
          
          // 保存會話
          await this.sessionRepository.save(session);
          await this.dispatchEvents(session);
        }, 'Failed to prepare next round');
      }
    } catch (error) {
      this.handleEventError('player-confirmed-next-round', error);
    }
  }
} 