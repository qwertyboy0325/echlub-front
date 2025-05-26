import { ValueObject } from '@/core/value-objects/ValueObject';
import { TrackReferenceVO } from './TrackReferenceVO';

interface RoundProps {
  roundNumber: number;
  startedAt: Date;
  durationSeconds: number;
  endedAt: Date | null;
  trackReferences: TrackReferenceVO[];
}

/**
 * 代表 JamSession 中的一個回合
 */
export class RoundVO extends ValueObject<RoundProps> {
  private constructor(props: RoundProps) {
    super(props);
  }

  public static create(
    roundNumber: number,
    startedAt: Date,
    durationSeconds: number
  ): RoundVO {
    if (roundNumber < 1) {
      throw new Error('Round number must be positive');
    }
    if (durationSeconds <= 0) {
      throw new Error('Duration must be positive');
    }
    return new RoundVO({
      roundNumber,
      startedAt,
      durationSeconds,
      endedAt: null,
      trackReferences: []
    });
  }

  protected validateProps(props: RoundProps): RoundProps {
    if (props.roundNumber < 1) {
      throw new Error('Round number must be positive');
    }
    if (props.durationSeconds <= 0) {
      throw new Error('Duration must be positive');
    }
    if (props.endedAt && props.endedAt < props.startedAt) {
      throw new Error('End time cannot be before start time');
    }
    return props;
  }

  protected equalsCore(other: RoundVO): boolean {
    return (
      this.props.roundNumber === other.props.roundNumber &&
      this.props.startedAt.getTime() === other.props.startedAt.getTime()
    );
  }

  /**
   * 添加音軌引用
   */
  addTrackReference(trackId: string, playerId: string): RoundVO {
    if (!trackId || !playerId) {
      throw new Error('Track ID and player ID are required');
    }
    
    const newTrackRef = TrackReferenceVO.create(
      trackId,
      playerId,
      this.props.roundNumber
    );
    
    return new RoundVO({
      ...this.props,
      trackReferences: [...this.props.trackReferences, newTrackRef]
    });
  }

  /**
   * 獲取玩家在此回合的所有音軌
   */
  getPlayerTracks(playerId: string): TrackReferenceVO[] {
    if (!playerId) {
      throw new Error('Player ID is required');
    }
    return this.props.trackReferences.filter(ref => ref.playerId === playerId);
  }

  /**
   * 獲取此回合的所有音軌
   */
  get tracks(): TrackReferenceVO[] {
    return [...this.props.trackReferences];
  }

  /**
   * 結束回合
   * @param endTime 回合結束時間，如果不提供則使用當前時間
   */
  end(endTime: Date = new Date()): RoundVO {
    if (this.isOver()) {
      throw new Error('Round is already ended');
    }
    if (endTime < this.props.startedAt) {
      throw new Error('End time cannot be before start time');
    }
    return new RoundVO({
      ...this.props,
      endedAt: endTime
    });
  }

  /**
   * 回合是否已結束
   */
  isOver(): boolean {
    return this.props.endedAt !== null;
  }

  get roundNumber(): number {
    return this.props.roundNumber;
  }

  get startedAt(): Date {
    return this.props.startedAt;
  }

  get durationSeconds(): number {
    return this.props.durationSeconds;
  }

  get endedAt(): Date | null {
    return this.props.endedAt;
  }

  /**
   * 計算剩餘時間
   * @param currentTime 當前時間
   * @returns 剩餘秒數，如果回合已結束則返回 0
   */
  getRemainingSeconds(currentTime: Date = new Date()): number {
    if (this.isOver()) {
      return 0;
    }
    
    const elapsedMs = currentTime.getTime() - this.props.startedAt.getTime();
    const elapsedSeconds = Math.floor(elapsedMs / 1000);
    const remainingSeconds = Math.max(0, this.props.durationSeconds - elapsedSeconds);
    
    return remainingSeconds;
  }

  toJSON(): object {
    return {
      roundNumber: this.props.roundNumber,
      startedAt: this.props.startedAt.toISOString(),
      durationSeconds: this.props.durationSeconds,
      endedAt: this.props.endedAt?.toISOString() || null,
      trackReferences: this.props.trackReferences.map(ref => ref.toJSON())
    };
  }

  toString(): string {
    return `Round ${this.props.roundNumber}${this.isOver() ? ' (Ended)' : ''}`;
  }
} 