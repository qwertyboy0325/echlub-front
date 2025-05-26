import { injectable, inject } from 'inversify';
import { JamSessionTypes } from '../../di/JamSessionTypes';
import type { SessionRepository } from '../../domain/interfaces/SessionRepository';
import type { IJamEventBus } from '../../domain/interfaces/IJamEventBus';
import { Session } from '../../domain/aggregates/Session';
import { BaseSessionEventHandler } from './BaseSessionEventHandler';

// Peer 離開房間事件類型
interface PeerLeftRoomEvent {
  roomId: string;
  peerId: string;
}

/**
 * 處理 Peer 離開房間事件
 */
@injectable()
export class PeerLeftRoomHandler extends BaseSessionEventHandler<PeerLeftRoomEvent> {
  constructor(
    @inject(JamSessionTypes.SessionRepository) sessionRepository: SessionRepository,
    @inject(JamSessionTypes.JamEventBus) eventBus: IJamEventBus
  ) {
    super(sessionRepository, eventBus);
  }
  
  /**
   * 從事件獲取會話
   * @param event 事件數據
   * @returns 會話實體，如果找不到則返回 null
   */
  protected async getSessionFromEvent(event: PeerLeftRoomEvent): Promise<Session | null> {
    // 查找房間中的會話
    return await this.sessionRepository.findByRoomId(event.roomId);
  }
  
  /**
   * 執行將玩家標記為不可用的操作
   * @param event 事件數據
   * @param session 會話實體
   */
  protected async executeOperation(event: PeerLeftRoomEvent, session: Session): Promise<void> {
    // 將玩家標記為不可用
    session.markPlayerAsUnavailable(event.peerId);
  }
} 