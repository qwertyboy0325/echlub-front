import { SessionId } from "../value-objects/SessionId";
import { RoleVO } from "../value-objects/RoleVO";
import { PlayerState } from "../entities/PlayerState";
import { DomainEvent } from "@/core/events/DomainEvent";
import { EventSourcedAggregateRoot } from "@/core/entities/EventSourcedAggregateRoot";
import { RoundId } from "../value-objects/RoundId";

// 會話事件
import { JamSessionCreatedEvent } from "../events/session/JamSessionCreatedEvent";
import { JamSessionStartedEvent } from "../events/session/JamSessionStartedEvent";
import { JamSessionEndedEvent } from "../events/session/JamSessionEndedEvent";
import { PlayerAddedEvent } from "../events/session/PlayerAddedEvent";

// 玩家事件
import { PlayerRoleSetEvent } from "../events/player/PlayerRoleSetEvent";
import { PlayerReadyToggledEvent } from "../events/player/PlayerReadyToggledEvent";
import { PlayerUnavailableEvent } from "../events/player/PlayerUnavailableEvent";

// 回合事件
import { RoundSetEvent } from "../events/round/RoundSetEvent";
import { RoundCompletedEvent } from "../events/round/RoundCompletedEvent";
import { NextRoundPreparedEvent } from "../events/round/NextRoundPreparedEvent";

/**
 * JamSession 狀態枚舉
 */
export enum SessionStatus {
  PENDING = "pending",
  IN_PROGRESS = "inProgress",
  ROUND_COMPLETION = "roundCompletion",
  ENDED = "ended",
}

/**
 * JamSession 聚合根
 * Session aggregate root focused on managing session lifecycle and player states
 * Uses event sourcing to maintain state through events
 */
export class Session extends EventSourcedAggregateRoot<SessionId> {
  private _players: Map<string, PlayerState> = new Map();
  private _status: SessionStatus = SessionStatus.PENDING;
  private _currentRoundNumber: number = 0;
  private _currentRoundId: RoundId | null = null;
  private readonly _completedRoundIds: Set<string> = new Set();
  private _roomId!: string;
  private _initiatorPeerId!: string;

  /**
   * 私有建構函數，使用工廠方法創建
   */
  private constructor(id: SessionId) {
    super(id, new Date(), new Date());
  }

  /**
   * 靜態工廠方法
   */
  public static create(
    id: SessionId,
    roomId: string,
    initiatorPeerId: string
  ): Session {
    const session = new Session(id);
    
    // 使用事件創建會話
    session.raiseEvent(
      new JamSessionCreatedEvent(
        id.toString(),
        roomId,
        initiatorPeerId
      )
    );
    
    // 添加創建者為第一個玩家
    session.raiseEvent(
      new PlayerAddedEvent(
        id.toString(),
        initiatorPeerId
      )
    );
    
    return session;
  }

  /**
   * 應用事件更新聚合根狀態
   * 實現 EventSourcedAggregateRoot 的抽象方法
   */
  protected applyEvent(event: DomainEvent): void {
    if (event instanceof JamSessionCreatedEvent) {
      this.applyJamSessionCreatedEvent(event);
    } else if (event instanceof PlayerAddedEvent) {
      this.applyPlayerAddedEvent(event);
    } else if (event instanceof PlayerRoleSetEvent) {
      this.applyPlayerRoleSetEvent(event);
    } else if (event instanceof PlayerReadyToggledEvent) {
      this.applyPlayerReadyToggledEvent(event);
    } else if (event instanceof JamSessionStartedEvent) {
      this.applyJamSessionStartedEvent(event);
    } else if (event instanceof RoundSetEvent) {
      this.applyRoundSetEvent(event);
    } else if (event instanceof RoundCompletedEvent) {
      this.applyRoundCompletedEvent(event);
    } else if (event instanceof NextRoundPreparedEvent) {
      this.applyNextRoundPreparedEvent(event);
    } else if (event instanceof JamSessionEndedEvent) {
      this.applyJamSessionEndedEvent(event);
    } else if (event instanceof PlayerUnavailableEvent) {
      this.applyPlayerUnavailableEvent(event);
    }
  }

  /**
   * 添加玩家
   * @param peerId 玩家 ID
   */
  public addPlayer(peerId: string): void {
    if (this._status !== SessionStatus.PENDING) {
      throw new Error("Players can only be added when session is pending");
    }

    if (this._players.has(peerId)) {
      return; // 玩家已經在會話中
    }

    this.raiseEvent(
      new PlayerAddedEvent(
        this._id.toString(),
        peerId
      )
    );
  }

  /**
   * 設置玩家角色
   * @param peerId 玩家 ID
   * @param role 角色值對象
   */
  public setPlayerRole(peerId: string, role: RoleVO): void {
    if (this._status !== SessionStatus.PENDING) {
      throw new Error("Roles can only be set when session is pending");
    }

    const playerState = this._players.get(peerId);
    if (!playerState) {
      throw new Error("Player not found in session");
    }

    if (
      role.isUnique() &&
      this.isRoleTaken(role) &&
      !playerState.hasRole(role)
    ) {
      throw new Error("This role is already taken by another player");
    }

    this.raiseEvent(
      new PlayerRoleSetEvent(
        this._id.toString(),
        peerId,
        role
      )
    );
  }

  /**
   * 設置玩家準備狀態
   * @param peerId 玩家 ID
   * @param isReady 是否準備
   */
  public setPlayerReady(peerId: string, isReady: boolean): void {
    const playerState = this._players.get(peerId);
    if (!playerState) {
      throw new Error("Player not found in session");
    }

    if (isReady && !playerState.hasRole()) {
      throw new Error("Player must have a role before being ready");
    }

    this.raiseEvent(
      new PlayerReadyToggledEvent(
        this._id.toString(),
        peerId,
        isReady
      )
    );
  }

  /**
   * 開始 JamSession
   */
  public startJamSession(): void {
    if (this._status !== SessionStatus.PENDING) {
      throw new Error("Session can only be started from pending state");
    }

    if (this._players.size === 0) {
      throw new Error("Cannot start session with no players");
    }

    if (!this.areAllPlayersReady()) {
      throw new Error("All players must be ready to start the session");
    }

    this.raiseEvent(
      new JamSessionStartedEvent(
        this._id.toString(),
        new Date(),
        Array.from(this._players.keys())
      )
    );
  }

  /**
   * 設置當前回合 ID
   * 當創建新的 Round 聚合根時，應當調用此方法
   */
  public setCurrentRound(roundId: RoundId, roundNumber: number): void {
    if (this._status !== SessionStatus.IN_PROGRESS) {
      throw new Error("Cannot set current round when session is not in progress");
    }
    
    this.raiseEvent(
      new RoundSetEvent(
        this._id.toString(),
        roundId.toString(),
        roundNumber
      )
    );
  }

  /**
   * 標記回合已完成
   */
  public markRoundCompleted(roundId: RoundId): void {
    this.raiseEvent(
      new RoundCompletedEvent(
        this._id.toString(),
        roundId.toString(),
        this._currentRoundNumber
      )
    );
  }

  /**
   * 準備下一回合
   * 返回下一個回合編號
   */
  public prepareNextRound(): number {
    if (this._status !== SessionStatus.ROUND_COMPLETION) {
      throw new Error("Can only prepare next round during round completion phase");
    }
    
    this.raiseEvent(
      new NextRoundPreparedEvent(
        this._id.toString(),
        this._currentRoundNumber + 1
      )
    );
    
    return this._currentRoundNumber;
  }

  /**
   * 結束 JamSession
   */
  public endJamSession(): void {
    if (this._status === SessionStatus.ENDED) {
      throw new Error("Session is already ended");
    }

    this.raiseEvent(
      new JamSessionEndedEvent(
        this._id.toString(),
        new Date()
      )
    );
  }

  /**
   * 將玩家標記為不可用
   * @param peerId 玩家 ID
   */
  public markPlayerAsUnavailable(peerId: string): void {
    const playerState = this._players.get(peerId);
    if (!playerState) {
      return;
    }

    this.raiseEvent(
      new PlayerUnavailableEvent(
        this._id.toString(),
        peerId
      )
    );
  }

  // 事件處理方法
  
  private applyJamSessionCreatedEvent(event: JamSessionCreatedEvent): void {
    // ID is already set in constructor, just set other properties
    this._roomId = event.roomId;
    this._initiatorPeerId = event.initiatorPeerId;
    this._status = SessionStatus.PENDING;
  }

  private applyPlayerAddedEvent(event: PlayerAddedEvent): void {
    const playerState = PlayerState.create(event.peerId, new Date(event.timestamp));
    this._players.set(event.peerId, playerState);
  }

  private applyPlayerRoleSetEvent(event: PlayerRoleSetEvent): void {
    const player = this._players.get(event.peerId);
    if (player) {
      player.setRole(event.role);
    }
  }

  private applyPlayerReadyToggledEvent(event: PlayerReadyToggledEvent): void {
    const player = this._players.get(event.peerId);
    if (player) {
      player.setReady(event.isReady);
    }
  }

  private applyJamSessionStartedEvent(event: JamSessionStartedEvent): void {
    this._status = SessionStatus.IN_PROGRESS;
  }

  private applyRoundSetEvent(event: RoundSetEvent): void {
    this._currentRoundId = RoundId.fromString(event.roundId);
    this._currentRoundNumber = event.roundNumber;
  }

  private applyRoundCompletedEvent(event: RoundCompletedEvent): void {
    this._completedRoundIds.add(event.roundId);
    
    // 如果是當前回合，更新狀態
    if (this._currentRoundId && this._currentRoundId.toString() === event.roundId) {
      this._status = SessionStatus.ROUND_COMPLETION;
    }
  }

  private applyNextRoundPreparedEvent(event: NextRoundPreparedEvent): void {
    this._status = SessionStatus.IN_PROGRESS;
    this._currentRoundNumber = event.nextRoundNumber;
    this._currentRoundId = null;
  }

  private applyJamSessionEndedEvent(event: JamSessionEndedEvent): void {
    this._status = SessionStatus.ENDED;
  }

  private applyPlayerUnavailableEvent(event: PlayerUnavailableEvent): void {
    this._players.delete(event.peerId);
    
    if (this._players.size === 0) {
      this._status = SessionStatus.ENDED;
    }
  }

  /**
   * 檢查角色是否已被使用
   * @param role 角色值對象
   * @returns 是否已被使用
   */
  private isRoleTaken(role: RoleVO): boolean {
    if (!role.isUnique()) {
      return false; // 非唯一角色可以被多個玩家使用
    }

    for (const player of this._players.values()) {
      if (player.hasRole(role)) {
        return true;
      }
    }
    return false;
  }

  /**
   * 檢查所有玩家是否都已準備
   * @returns 是否都已準備
   */
  private areAllPlayersReady(): boolean {
    if (this._players.size === 0) {
      return false;
    }

    for (const player of this._players.values()) {
      if (!player.isReady) {
        return false;
      }
    }
    return true;
  }

  /**
   * 會話 ID
   */
  get sessionId(): SessionId {
    return this._id as SessionId;
  }

  /**
   * 房間 ID
   */
  get roomId(): string {
    return this._roomId;
  }

  /**
   * 會話狀態
   */
  get status(): SessionStatus {
    return this._status;
  }

  /**
   * 玩家列表
   */
  get players(): Map<string, PlayerState> {
    return new Map(this._players);
  }

  /**
   * 當前回合編號
   */
  get currentRoundNumber(): number {
    return this._currentRoundNumber;
  }

  /**
   * 當前回合 ID
   */
  get currentRoundId(): RoundId | null {
    return this._currentRoundId;
  }

  /**
   * 玩家數量
   */
  get playerCount(): number {
    return this._players.size;
  }

  /**
   * 獲取所有玩家 ID
   */
  get playerIds(): string[] {
    return Array.from(this._players.keys());
  }
}
