import { injectable, inject } from 'inversify';
import { JamSessionTypes } from '../di/JamSessionTypes';
import type { IMediator } from '../../../core/mediator/IMediator';
import { CreateJamSessionCommand } from '../application/commands/CreateJamSessionCommand';
import { JoinJamSessionCommand } from '../application/commands/JoinJamSessionCommand';
import { SetPlayerRoleCommand } from '../application/commands/SetPlayerRoleCommand';
import { TogglePlayerReadyCommand } from '../application/commands/TogglePlayerReadyCommand';
import { StartJamSessionCommand } from '../application/commands/StartJamSessionCommand';
import { StartNextRoundCommand } from '../application/commands/StartNextRoundCommand';
import { EndCurrentRoundCommand } from '../application/commands/EndCurrentRoundCommand';
import { EndJamSessionCommand } from '../application/commands/EndJamSessionCommand';
import { GetSessionByIdQuery } from '../application/queries/GetSessionByIdQuery';
import { GetCurrentSessionInRoomQuery } from '../application/queries/GetCurrentSessionInRoomQuery';
import type { SessionDto } from '../application/types';

@injectable()
export class JamSessionPresenter {
  constructor(
    @inject(JamSessionTypes.Mediator) private readonly mediator: IMediator
  ) {}

  // === 查詢方法 ===

  /**
   * 根據 ID 獲取 Jam Session
   * @param sessionId Session ID
   * @returns Session DTO 或 null
   */
  async getSessionById(sessionId: string): Promise<SessionDto | null> {
    const query = new GetSessionByIdQuery(sessionId);
    return this.mediator.query(query);
  }

  /**
   * 獲取房間中當前的 Jam Session
   * @param roomId 房間 ID
   * @returns Session DTO 或 null
   */
  async getCurrentSessionInRoom(roomId: string): Promise<SessionDto | null> {
    const query = new GetCurrentSessionInRoomQuery(roomId);
    return this.mediator.query(query);
  }

  // === 命令方法 ===

  /**
   * 創建新的 Jam Session
   * @param roomId 房間 ID
   * @param initiatorPeerId 發起者的 Peer ID
   * @returns Session ID
   */
  async createSession(roomId: string, initiatorPeerId: string): Promise<string> {
    const command = new CreateJamSessionCommand(roomId, initiatorPeerId);
    return this.mediator.send(command);
  }

  /**
   * 加入 Jam Session
   * @param sessionId Session ID
   * @param peerId 玩家的 Peer ID
   */
  async joinSession(sessionId: string, peerId: string): Promise<void> {
    const command = new JoinJamSessionCommand(sessionId, peerId);
    await this.mediator.send(command);
  }

  /**
   * 設置玩家角色
   * @param sessionId Session ID
   * @param peerId 玩家的 Peer ID
   * @param roleId 角色 ID
   * @param roleName 角色名稱
   * @param roleColor 角色顏色
   */
  async setPlayerRole(
    sessionId: string,
    peerId: string,
    roleId: string,
    roleName: string,
    roleColor: string
  ): Promise<void> {
    const command = new SetPlayerRoleCommand(
      sessionId,
      peerId,
      roleId,
      roleName,
      roleColor
    );
    await this.mediator.send(command);
  }

  /**
   * 切換玩家準備狀態
   * @param sessionId Session ID
   * @param peerId 玩家的 Peer ID
   * @param isReady 是否準備
   */
  async togglePlayerReady(
    sessionId: string,
    peerId: string,
    isReady: boolean
  ): Promise<void> {
    const command = new TogglePlayerReadyCommand(sessionId, peerId, isReady);
    await this.mediator.send(command);
  }

  /**
   * 開始 Jam Session
   * @param sessionId Session ID
   * @param initiatorPeerId 發起開始的玩家 Peer ID
   */
  async startSession(sessionId: string, initiatorPeerId: string): Promise<void> {
    const command = new StartJamSessionCommand(sessionId, initiatorPeerId);
    await this.mediator.send(command);
  }

  /**
   * 開始下一回合
   * @param sessionId Session ID
   * @param durationSeconds 回合持續時間（秒）
   */
  async startNextRound(
    sessionId: string,
    durationSeconds: number
  ): Promise<void> {
    const command = new StartNextRoundCommand(sessionId, durationSeconds);
    await this.mediator.send(command);
  }

  /**
   * 結束當前回合
   * @param sessionId Session ID
   */
  async endCurrentRound(sessionId: string): Promise<void> {
    const command = new EndCurrentRoundCommand(sessionId);
    await this.mediator.send(command);
  }

  /**
   * 結束 Jam Session
   * @param sessionId Session ID
   * @param initiatorPeerId 發起結束的玩家 Peer ID
   */
  async endSession(sessionId: string, initiatorPeerId: string): Promise<void> {
    const command = new EndJamSessionCommand(sessionId, initiatorPeerId);
    await this.mediator.send(command);
  }
} 