import { injectable, inject } from 'inversify';
import { JamSessionTypes } from '../../di/JamSessionTypes';
import { JamEventBus } from '../../infrastructure/messaging/JamEventBus';
import { JamEventTypes } from '../../domain/events/EventTypes';

/**
 * 倒計時服務
 */
@injectable()
export class CountdownService {
  private timers: Map<string, NodeJS.Timeout> = new Map();
  
  constructor(
    @inject(JamSessionTypes.JamEventBus) private eventBus: JamEventBus
  ) {
    // 訂閱回合開始事件，自動啟動倒計時
    this.eventBus.subscribe('jam.round-started', this.handleRoundStarted.bind(this));
    
    // 訂閱回合結束事件，自動取消倒計時
    this.eventBus.subscribe('jam.round-ended', this.handleRoundEnded.bind(this));
  }
  
  /**
   * 啟動倒計時
   * @param sessionId 會話 ID
   * @param roundNumber 回合編號
   * @param durationSeconds 持續時間（秒）
   */
  startCountdown(sessionId: string, roundNumber: number, durationSeconds: number): void {
    // 建立計時器 ID
    const timerId = `${sessionId}-${roundNumber}`;
    
    // 清除任何現有的計時器
    this.clearTimer(timerId);
    
    // 計算結束時間
    const endTime = new Date(new Date().getTime() + durationSeconds * 1000);
    
    // 初始化剩餘時間
    let remainingSeconds = durationSeconds;
    
    // 建立計時器，每秒更新
    const timer = setInterval(() => {
      // 減少剩餘時間
      remainingSeconds--;
      
      // 發送倒計時事件
      this.eventBus.publish(JamEventTypes.COUNTDOWN_TICK, {
        sessionId,
        roundNumber,
        remainingSeconds,
        tickTime: new Date().toISOString()
      });
      
      // 當達到 0 時停止計時器
      if (remainingSeconds <= 0) {
        this.clearTimer(timerId);
      }
    }, 1000);
    
    // 儲存計時器引用
    this.timers.set(timerId, timer);
  }
  
  /**
   * 取消倒計時
   * @param sessionId 會話 ID
   * @param roundNumber 回合編號
   */
  cancelCountdown(sessionId: string, roundNumber: number): void {
    const timerId = `${sessionId}-${roundNumber}`;
    this.clearTimer(timerId);
  }
  
  /**
   * 處理回合開始事件
   * @param event 回合開始事件
   */
  private handleRoundStarted(event: any): void {
    const { sessionId, roundNumber, durationSeconds } = event;
    this.startCountdown(sessionId, roundNumber, durationSeconds);
  }
  
  /**
   * 處理回合結束事件
   * @param event 回合結束事件
   */
  private handleRoundEnded(event: any): void {
    const { sessionId, roundNumber } = event;
    this.cancelCountdown(sessionId, roundNumber);
  }
  
  /**
   * 清除計時器
   * @param timerId 計時器 ID
   */
  private clearTimer(timerId: string): void {
    if (this.timers.has(timerId)) {
      clearInterval(this.timers.get(timerId));
      this.timers.delete(timerId);
    }
  }
} 