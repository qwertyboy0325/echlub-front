import { injectable, inject } from 'inversify';
import { JamSessionTypes } from '../../di/JamSessionTypes';
import { SessionRepository } from '../../domain/interfaces/SessionRepository';
import { SessionId } from '../../domain/value-objects/SessionId';
import { JamEventBus } from '../messaging/JamEventBus';

/**
 * JamSession 計時器調度器
 */
@injectable()
export class JamTimerScheduler {
  private timers: Map<string, NodeJS.Timeout> = new Map();
  
  constructor(
    @inject(JamSessionTypes.SessionRepository) private sessionRepository: SessionRepository,
    @inject(JamSessionTypes.JamEventBus) private eventBus: JamEventBus
  ) {
    // 訂閱回合開始事件，自動安排回合結束
    this.eventBus.subscribe('jam.round-started', this.scheduleRoundEnd.bind(this));
  }
  
  /**
   * 安排回合結束
   * @param event 回合開始事件
   */
  private async scheduleRoundEnd(event: any): Promise<void> {
    const { sessionId, roundNumber, durationSeconds } = event;
    
    // 生成計時器 ID
    const timerId = `round-end-${sessionId}-${roundNumber}`;
    
    // 清除現有計時器
    this.clearTimer(timerId);
    
    // 設置計時器來結束回合
    const timer = setTimeout(async () => {
      // 查找會話
      const session = await this.sessionRepository.findById(SessionId.fromString(sessionId));
      
      if (!session) {
        console.error(`Session ${sessionId} not found when trying to end round ${roundNumber}`);
        return;
      }
      
      try {
        // 結束當前回合
        session.endCurrentRound();
        
        // 保存會話
        await this.sessionRepository.save(session);
        
        // 發布領域事件
        for (const event of session.collectDomainEvents()) {
          await this.eventBus.publish(event.eventType, event);
        }
      } catch (error) {
        console.error(`Error ending round ${roundNumber} for session ${sessionId}:`, error);
      }
      
      // 移除計時器引用
      this.timers.delete(timerId);
    }, durationSeconds * 1000);
    
    // 儲存計時器引用
    this.timers.set(timerId, timer);
  }
  
  /**
   * 取消計時器
   * @param sessionId 會話 ID
   * @param roundNumber 回合編號
   */
  cancelRoundEndTimer(sessionId: string, roundNumber: number): void {
    const timerId = `round-end-${sessionId}-${roundNumber}`;
    this.clearTimer(timerId);
  }
  
  /**
   * 清除計時器
   * @param timerId 計時器 ID
   */
  private clearTimer(timerId: string): void {
    if (this.timers.has(timerId)) {
      clearTimeout(this.timers.get(timerId));
      this.timers.delete(timerId);
    }
  }
} 