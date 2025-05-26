import { RoleVO } from '../value-objects/RoleVO';

/**
 * 代表 JamSession 中玩家的狀態
 */
export class PlayerState {
  private _role: RoleVO | null = null;
  private _isReady: boolean = false;
  private _hasCompletedCurrentRound: boolean = false;
  private _confirmedNextRound: boolean = false;
  private readonly _peerId: string;
  private readonly _joinedAt: Date;
  
  /**
   * 私有構造函數，使用 create 工廠方法創建實例
   * @param peerId 玩家 ID
   * @param joinedAt 加入時間
   */
  private constructor(peerId: string, joinedAt: Date) {
    this._peerId = peerId;
    this._joinedAt = joinedAt;
  }
  
  /**
   * 創建 PlayerState 實例
   * @param peerId 玩家 ID
   * @param joinedAt 加入時間
   * @returns PlayerState 實例
   */
  public static create(peerId: string, joinedAt: Date): PlayerState {
    return new PlayerState(peerId, joinedAt);
  }
  
  /**
   * 設置玩家角色
   * @param role 角色值對象
   */
  public setRole(role: RoleVO | null): void {
    this._role = role;
    
    // 更換角色時重置準備狀態
    this._isReady = false;
  }
  
  /**
   * a設置玩家準備狀態
   * @param isReady 是否準備
   */
  public setReady(isReady: boolean): void {
    this._isReady = isReady;
  }
  
  /**
   * 設置當前回合完成狀態
   */
  public setRoundCompletion(completed: boolean): void {
    this._hasCompletedCurrentRound = completed;
  }
  
  /**
   * 設置是否確認進入下一回合
   */
  public setNextRoundConfirmation(confirmed: boolean): void {
    this._confirmedNextRound = confirmed;
  }
  
  /**
   * 重置回合相關狀態
   */
  public resetRoundState(): void {
    this._hasCompletedCurrentRound = false;
    this._confirmedNextRound = false;
  }
  
  /**
   * 檢查玩家是否有角色
   * @param specificRole 特定角色（可選）
   * @returns 是否有指定角色
   */
  public hasRole(specificRole?: RoleVO): boolean {
    if (!this._role) {
      return false;
    }
    
    if (specificRole) {
      return this._role.equals(specificRole);
    }
    
    return true;
  }
  
  /**
   * 玩家 ID
   */
  get peerId(): string { return this._peerId; }
  
  /**
   * 玩家角色
   */
  get role(): RoleVO | null { return this._role; }
  
  /**
   * 玩家準備狀態
   */
  get isReady(): boolean { return this._isReady; }
  
  /**
   * 玩家加入時間
   */
  get joinedAt(): Date { return new Date(this._joinedAt); }
  
  get hasCompletedCurrentRound(): boolean { return this._hasCompletedCurrentRound; }
  get hasConfirmedNextRound(): boolean { return this._confirmedNextRound; }
} 