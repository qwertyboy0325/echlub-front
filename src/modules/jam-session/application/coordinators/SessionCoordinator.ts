import { injectable, inject } from 'inversify';
import { PlayerUnavailableEvent } from '../../domain/events/player/PlayerUnavailableEvent';
import { JamSessionTypes } from '../../di/JamSessionTypes';
import { Session } from '../../domain/aggregates/Session';
import type { SessionRepository } from '../../domain/interfaces/SessionRepository';
import type { IJamEventBus } from '../../domain/interfaces/IJamEventBus';
import { SessionId } from '../../domain/value-objects/SessionId';
import { RoleVO } from '../../domain/value-objects/RoleVO';
import { BaseCoordinator } from './BaseCoordinator';

/**
 * Session 應用層協調器
 * 負責管理會話生命週期、玩家管理和整體狀態轉換
 */
@injectable()
export class SessionCoordinator extends BaseCoordinator {
  constructor(
    @inject(JamSessionTypes.SessionRepository) private readonly sessionRepository: SessionRepository,
    @inject(JamSessionTypes.JamEventBus) eventBus: IJamEventBus
  ) {
    super(eventBus);
    this.setupEventHandlers();
  }

  /**
   * 設置事件處理器
   */
  protected setupEventHandlers(): void {
    // 監聽外部系統事件
    this.eventBus.subscribe('collab.peer-left-room', this.handlePeerLeftRoom.bind(this));
    this.eventBus.subscribe('collab.room-closed', this.handleRoomClosed.bind(this));
  }

  /**
   * 處理玩家離開房間事件
   */
  private async handlePeerLeftRoom(event: any): Promise<void> {
    try {
      const { roomId, peerId } = event;
      
      // 查找房間中的會話
      const session = await this.sessionRepository.findByRoomId(roomId);
      if (!session) return; // 房間中沒有會話，無需處理
      
      await this.executeDomainOperation(async () => {
        // 將玩家標記為不可用
        session.markPlayerAsUnavailable(peerId);
        
        // 保存並發布事件
        await this.sessionRepository.save(session);
        await this.dispatchSessionEvents(session);
      }, 'Failed to handle peer left room');
    } catch (error) {
      this.handleEventError('peer-left-room', error);
    }
  }

  /**
   * 處理房間關閉事件
   */
  private async handleRoomClosed(event: any): Promise<void> {
    try {
      const { roomId } = event;
      
      // 查找房間中的會話
      const session = await this.sessionRepository.findByRoomId(roomId);
      if (!session) return; // 房間中沒有會話，無需處理
      
      await this.executeDomainOperation(async () => {
        // 結束會話
        session.endJamSession();
        
        // 保存並發布事件
        await this.sessionRepository.save(session);
        await this.dispatchSessionEvents(session);
      }, 'Failed to handle room closed');
    } catch (error) {
      this.handleEventError('room-closed', error);
    }
  }

  /**
   * 創建會話
   */
  async createSession(roomId: string, initiatorPeerId: string): Promise<string> {
    return await this.executeDomainOperation(async () => {
      // 生成新會話ID
      const sessionIdStr = crypto.randomUUID();
      const sessionId = SessionId.fromString(sessionIdStr);
      
      // 創建會話
      const session = Session.create(
        sessionId,
        roomId,
        initiatorPeerId
      );
      
      // 保存並發布事件
      await this.sessionRepository.save(session);
      await this.dispatchSessionEvents(session);
      
      return sessionIdStr;
    }, 'Failed to create session');
  }

  /**
   * 設置玩家角色
   */
  async setPlayerRole(sessionId: string, peerId: string, roleId: string): Promise<void> {
    await this.executeDomainOperation(async () => {
      const session = await this.sessionRepository.findById(sessionId);
      this.validateExists(session, 'Session', sessionId);
      
      // 創建角色值對象
      const role = RoleVO.create(roleId, `Role ${roleId}`, '#000000');
      
      // 設置玩家角色
      session.setPlayerRole(peerId, role);
      
      // 保存並發布事件
      await this.sessionRepository.save(session);
      await this.dispatchSessionEvents(session);
    }, 'Failed to set player role');
  }

  /**
   * 切換玩家準備狀態
   */
  async togglePlayerReady(sessionId: string, peerId: string, isReady: boolean): Promise<void> {
    await this.executeDomainOperation(async () => {
      const session = await this.sessionRepository.findById(sessionId);
      this.validateExists(session, 'Session', sessionId);
      
      // 設置玩家準備狀態
      session.setPlayerReady(peerId, isReady);
      
      // 保存並發布事件
      await this.sessionRepository.save(session);
      await this.dispatchSessionEvents(session);
    }, 'Failed to toggle player ready state');
  }

  /**
   * 開始會話
   */
  async startJamSession(sessionId: string): Promise<void> {
    await this.executeDomainOperation(async () => {
      const session = await this.sessionRepository.findById(sessionId);
      this.validateExists(session, 'Session', sessionId);
      
      // 開始會話
      session.startJamSession();
      
      // 保存並發布事件
      await this.sessionRepository.save(session);
      await this.dispatchSessionEvents(session);
    }, 'Failed to start jam session');
  }

  /**
   * 結束會話
   */
  async endJamSession(sessionId: string): Promise<void> {
    await this.executeDomainOperation(async () => {
      const session = await this.sessionRepository.findById(sessionId);
      this.validateExists(session, 'Session', sessionId);
      
      // 結束會話
      session.endJamSession();
      
      // 保存並發布事件
      await this.sessionRepository.save(session);
      await this.dispatchSessionEvents(session);
    }, 'Failed to end jam session');
  }

  /**
   * 添加玩家到會話
   */
  async addPlayer(sessionId: string, peerId: string): Promise<void> {
    await this.executeDomainOperation(async () => {
      const session = await this.sessionRepository.findById(sessionId);
      this.validateExists(session, 'Session', sessionId);
      
      // 添加玩家
      session.addPlayer(peerId);
      
      // 保存並發布事件
      await this.sessionRepository.save(session);
      await this.dispatchSessionEvents(session);
    }, 'Failed to add player');
  }
} 