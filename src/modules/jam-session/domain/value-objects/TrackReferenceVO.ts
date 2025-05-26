import { ValueObject } from '@/core/value-objects/ValueObject';

interface TrackReferenceProps {
  trackId: string;
  playerId: string;
  roundNumber: number;
  createdAt: Date;
}

/**
 * 代表一個回合中的音軌引用
 */
export class TrackReferenceVO extends ValueObject<TrackReferenceProps> {
  private constructor(props: TrackReferenceProps) {
    super(props);
  }

  public static create(
    trackId: string,
    playerId: string,
    roundNumber: number,
    createdAt: Date = new Date()
  ): TrackReferenceVO {
    if (!trackId || !playerId) {
      throw new Error('Track ID and player ID are required');
    }
    if (roundNumber < 1) {
      throw new Error('Round number must be positive');
    }
    return new TrackReferenceVO({
      trackId,
      playerId,
      roundNumber,
      createdAt
    });
  }

  protected validateProps(props: TrackReferenceProps): TrackReferenceProps {
    if (!props.trackId || !props.playerId) {
      throw new Error('Track ID and player ID are required');
    }
    if (props.roundNumber < 1) {
      throw new Error('Round number must be positive');
    }
    return props;
  }

  protected equalsCore(other: TrackReferenceVO): boolean {
    return (
      this.props.trackId === other.props.trackId &&
      this.props.playerId === other.props.playerId &&
      this.props.roundNumber === other.props.roundNumber
    );
  }

  get trackId(): string {
    return this.props.trackId;
  }

  get playerId(): string {
    return this.props.playerId;
  }

  get roundNumber(): number {
    return this.props.roundNumber;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  toJSON(): object {
    return {
      trackId: this.props.trackId,
      playerId: this.props.playerId,
      roundNumber: this.props.roundNumber,
      createdAt: this.props.createdAt.toISOString()
    };
  }

  toString(): string {
    return `Track(${this.props.trackId}) by Player(${this.props.playerId}) in Round ${this.props.roundNumber}`;
  }
} 