import { EventSourcedAggregateRoot } from "@/core/entities/EventSourcedAggregateRoot";
import { DomainEvent } from "@/core/events/DomainEvent";
import { TrackReferenceVO } from "../value-objects/TrackReferenceVO";
import { RoundStartedEvent } from "../events/round/RoundStartedEvent";
import { RoundEndedEvent } from "../events/round/RoundEndedEvent";
import { TrackAddedToRoundEvent } from "../events/round/TrackAddedToRoundEvent";
import { PlayerCompletedRoundEvent } from "../events/player/PlayerCompletedRoundEvent";
import { PlayerConfirmedNextRoundEvent } from "../events/player/PlayerConfirmedNextRoundEvent";
import { RoundId } from "../value-objects/RoundId";

/**
 * 回合狀態
 */
export enum RoundStatus {
  IN_PROGRESS = "inProgress",
  COMPLETED = "completed"
}

/**
 * 回合聚合根
 */
export class Round extends EventSourcedAggregateRoot<RoundId> {
  private _trackReferences: TrackReferenceVO[] = [];
  private _completedPlayerIds: Set<string> = new Set();
  private _confirmedPlayerIds: Set<string> = new Set();
  private _status: RoundStatus = RoundStatus.IN_PROGRESS;
  private _endedAt: Date | null = null;
  private _sessionId!: string;
  private _roundNumber!: number;
  private _startedAt!: Date;
  private _durationSeconds!: number;

  /**
   * 私有建構函數，使用工廠方法創建
   */
  private constructor(id: RoundId) {
    super(id, new Date(), new Date());
  }

  /**
   * 應用事件更新聚合根狀態
   * 實現 EventSourcedAggregateRoot 的抽象方法
   */
  protected applyEvent(event: DomainEvent): void {
    if (event instanceof RoundStartedEvent) {
      this.applyRoundStartedEvent(event);
    } else if (event instanceof TrackAddedToRoundEvent) {
      this.applyTrackAddedToRoundEvent(event);
    } else if (event instanceof PlayerCompletedRoundEvent) {
      this.applyPlayerCompletedRoundEvent(event);
    } else if (event instanceof PlayerConfirmedNextRoundEvent) {
      this.applyPlayerConfirmedNextRoundEvent(event);
    } else if (event instanceof RoundEndedEvent) {
      this.applyRoundEndedEvent(event);
    }
  }

  /**
   * 創建新回合
   */
  public static create(
    sessionId: string,
    roundNumber: number,
    durationSeconds: number
  ): Round {
    if (roundNumber < 1) {
      throw new Error("Round number must be positive");
    }
    
    if (durationSeconds <= 0) {
      throw new Error("Duration must be positive");
    }
    
    const roundId = RoundId.create();
    const round = new Round(roundId);
    const startedAt = new Date();
    
    round.raiseEvent(
      new RoundStartedEvent(
        sessionId,
        roundId.toString(),
        roundNumber,
        startedAt,
        durationSeconds
      )
    );
    
    return round;
  }

  /**
   * 添加音軌到回合
   */
  public addTrack(trackId: string, peerId: string): void {
    if (this._status !== RoundStatus.IN_PROGRESS) {
      throw new Error("Cannot add tracks to a completed round");
    }
    
    if (!trackId || !peerId) {
      throw new Error("Track ID and player ID are required");
    }
    
    this.raiseEvent(
      new TrackAddedToRoundEvent(
        this._sessionId,
        this._id.toString(),
        this._roundNumber,
        trackId,
        peerId
      )
    );
  }

  /**
   * 標記玩家完成回合
   */
  public markPlayerCompleted(peerId: string): void {
    if (this._status !== RoundStatus.IN_PROGRESS) {
      throw new Error("Round is already completed");
    }
    
    if (!peerId) {
      throw new Error("Player ID is required");
    }
    
    if (this._completedPlayerIds.has(peerId)) {
      return; // 已經標記為完成
    }
    
    this.raiseEvent(
      new PlayerCompletedRoundEvent(
        this._sessionId,
        this._roundNumber,
        peerId
      )
    );
  }

  /**
   * 標記玩家確認進入下一回合
   */
  public confirmNextRound(peerId: string): void {
    if (this._status !== RoundStatus.IN_PROGRESS) {
      throw new Error("Round is already completed");
    }
    
    if (!peerId) {
      throw new Error("Player ID is required");
    }
    
    if (this._confirmedPlayerIds.has(peerId)) {
      return; // 已經確認過
    }
    
    this.raiseEvent(
      new PlayerConfirmedNextRoundEvent(
        this._sessionId,
        this._id.toString(),
        this._roundNumber,
        peerId
      )
    );
  }

  /**
   * 結束回合
   */
  public end(): void {
    if (this._status !== RoundStatus.IN_PROGRESS) {
      throw new Error("Round is already completed");
    }
    
    this.raiseEvent(
      new RoundEndedEvent(
        this._sessionId,
        this._id.toString(),
        this._roundNumber,
        new Date()
      )
    );
  }
  
  // 事件處理方法
  
  private applyRoundStartedEvent(event: RoundStartedEvent): void {
    // _id is already set in constructor
    this._sessionId = event.sessionId;
    this._roundNumber = event.roundNumber;
    this._startedAt = new Date(event.startTime);
    this._durationSeconds = event.durationSeconds;
    this._status = RoundStatus.IN_PROGRESS;
  }
  
  private applyTrackAddedToRoundEvent(event: TrackAddedToRoundEvent): void {
    const trackReference = TrackReferenceVO.create(
      event.trackId,
      event.playerId,
      this._roundNumber
    );
    
    this._trackReferences.push(trackReference);
  }
  
  private applyPlayerCompletedRoundEvent(event: PlayerCompletedRoundEvent): void {
    this._completedPlayerIds.add(event.peerId);
  }
  
  private applyPlayerConfirmedNextRoundEvent(event: PlayerConfirmedNextRoundEvent): void {
    this._confirmedPlayerIds.add(event.playerId);
  }
  
  private applyRoundEndedEvent(event: RoundEndedEvent): void {
    this._status = RoundStatus.COMPLETED;
    this._endedAt = new Date(event.endTime);
  }

  /**
   * 檢查是否所有玩家都完成了回合
   * @param peerIds 參與回合的所有玩家ID
   */
  public areAllPlayersCompleted(peerIds: string[]): boolean {
    if (peerIds.length === 0) {
      return true;
    }
    
    for (const peerId of peerIds) {
      if (!this._completedPlayerIds.has(peerId)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * 檢查是否所有玩家都確認了下一回合
   * @param peerIds 參與回合的所有玩家ID
   */
  public areAllPlayersConfirmed(peerIds: string[]): boolean {
    if (peerIds.length === 0) {
      return true;
    }
    
    for (const peerId of peerIds) {
      if (!this._confirmedPlayerIds.has(peerId)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * 獲取玩家的音軌
   */
  public getTracksForPlayer(peerId: string): TrackReferenceVO[] {
    return this._trackReferences.filter(track => track.playerId === peerId);
  }

  /**
   * 獲取回合中的所有音軌
   */
  public getAllTracks(): TrackReferenceVO[] {
    return [...this._trackReferences];
  }

  /**
   * 回合是否已結束
   */
  public isCompleted(): boolean {
    return this._status === RoundStatus.COMPLETED;
  }

  /**
   * 計算剩餘時間
   */
  public getRemainingSeconds(currentTime: Date = new Date()): number {
    if (this.isCompleted()) {
      return 0;
    }
    
    const elapsedMs = currentTime.getTime() - this._startedAt.getTime();
    const elapsedSeconds = Math.floor(elapsedMs / 1000);
    const remainingSeconds = Math.max(0, this._durationSeconds - elapsedSeconds);
    
    return remainingSeconds;
  }

  // Getters
  get id(): RoundId { return this._id; }
  get sessionId(): string { return this._sessionId; }
  get roundNumber(): number { return this._roundNumber; }
  get startedAt(): Date { return new Date(this._startedAt); }
  get endedAt(): Date | null { return this._endedAt ? new Date(this._endedAt) : null; }
  get durationSeconds(): number { return this._durationSeconds; }
  get status(): RoundStatus { return this._status; }
  get completedPeerIds(): string[] { return [...this._completedPlayerIds]; }
  get confirmedPeerIds(): string[] { return [...this._confirmedPlayerIds]; }
} 