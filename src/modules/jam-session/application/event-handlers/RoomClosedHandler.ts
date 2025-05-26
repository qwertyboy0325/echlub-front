import { injectable, inject } from "inversify";
import { JamSessionTypes } from "../../di/JamSessionTypes";
import type { SessionRepository } from "../../domain/interfaces/SessionRepository";
import type { IJamEventBus } from "../../domain/interfaces/IJamEventBus";
import { Session } from '../../domain/aggregates/Session';
import { BaseSessionEventHandler } from './BaseSessionEventHandler';

// 房間關閉事件類型
interface RoomClosedEvent {
  roomId: string;
}

/**
 * 處理房間關閉事件
 */
@injectable()
export class RoomClosedHandler extends BaseSessionEventHandler<RoomClosedEvent> {
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
  protected async getSessionFromEvent(event: RoomClosedEvent): Promise<Session | null> {
    // 查找房間中的會話
    return await this.sessionRepository.findByRoomId(event.roomId);
  }
  
  /**
   * 執行結束會話的操作
   * @param event 事件數據
   * @param session 會話實體
   */
  protected async executeOperation(event: RoomClosedEvent, session: Session): Promise<void> {
    // 結束會話
    session.endJamSession();
  }
}
