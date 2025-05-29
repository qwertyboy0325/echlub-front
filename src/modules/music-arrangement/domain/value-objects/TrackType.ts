import { ValueObject } from '../../../../core/value-objects/ValueObject';

export enum TrackTypeEnum {
  AUDIO = 'AUDIO',
  INSTRUMENT = 'INSTRUMENT',
  BUS = 'BUS'
}

export interface TrackTypeProps {
  type: TrackTypeEnum;
}

/**
 * Track type value object
 * Defines the type of track (Audio, Instrument, or Bus)
 */
export class TrackType extends ValueObject<TrackTypeProps> {
  private constructor(type: TrackTypeEnum) {
    super({ type });
  }

  public static audio(): TrackType {
    return new TrackType(TrackTypeEnum.AUDIO);
  }

  public static instrument(): TrackType {
    return new TrackType(TrackTypeEnum.INSTRUMENT);
  }

  public static bus(): TrackType {
    return new TrackType(TrackTypeEnum.BUS);
  }

  public static fromString(type: string): TrackType {
    const upperType = type.toUpperCase();
    if (!Object.values(TrackTypeEnum).includes(upperType as TrackTypeEnum)) {
      throw new Error(`Invalid track type: ${type}`);
    }
    return new TrackType(upperType as TrackTypeEnum);
  }

  protected validateProps(props: TrackTypeProps): TrackTypeProps {
    if (!Object.values(TrackTypeEnum).includes(props.type)) {
      throw new Error(`Invalid track type: ${props.type}`);
    }
    return props;
  }

  protected equalsCore(other: TrackType): boolean {
    return this.props.type === other.props.type;
  }

  // Type checking methods
  public isAudio(): boolean {
    return this.props.type === TrackTypeEnum.AUDIO;
  }

  public isInstrument(): boolean {
    return this.props.type === TrackTypeEnum.INSTRUMENT;
  }

  public isBus(): boolean {
    return this.props.type === TrackTypeEnum.BUS;
  }

  public get value(): TrackTypeEnum {
    return this.props.type;
  }

  public toString(): string {
    return this.props.type;
  }
} 