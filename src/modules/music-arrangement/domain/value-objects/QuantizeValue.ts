import { ValueObject } from '../../../../core/value-objects/ValueObject';

export enum QuantizeType {
  WHOLE = '1/1',
  HALF = '1/2',
  QUARTER = '1/4',
  EIGHTH = '1/8',
  SIXTEENTH = '1/16',
  THIRTY_SECOND = '1/32',
  TRIPLET_QUARTER = '1/4T',
  TRIPLET_EIGHTH = '1/8T',
  TRIPLET_SIXTEENTH = '1/16T'
}

export interface QuantizeValueProps {
  type: QuantizeType;
  swing?: number; // 0-100, percentage of swing
}

/**
 * Quantize Value Object
 * Represents quantization settings for MIDI operations
 */
export class QuantizeValue extends ValueObject<QuantizeValueProps> {
  constructor(props: QuantizeValueProps) {
    super(props);
  }

  public static quarter(): QuantizeValue {
    return new QuantizeValue({ type: QuantizeType.QUARTER });
  }

  public static eighth(): QuantizeValue {
    return new QuantizeValue({ type: QuantizeType.EIGHTH });
  }

  public static sixteenth(): QuantizeValue {
    return new QuantizeValue({ type: QuantizeType.SIXTEENTH });
  }

  public static tripletEighth(): QuantizeValue {
    return new QuantizeValue({ type: QuantizeType.TRIPLET_EIGHTH });
  }

  public static fromString(value: string): QuantizeValue {
    const type = Object.values(QuantizeType).find(t => t === value);
    if (!type) {
      throw new Error(`Invalid quantize type: ${value}`);
    }
    return new QuantizeValue({ type });
  }

  protected validateProps(props: QuantizeValueProps): QuantizeValueProps {
    if (!Object.values(QuantizeType).includes(props.type)) {
      throw new Error(`Invalid quantize type: ${props.type}`);
    }
    
    if (props.swing !== undefined && (props.swing < 0 || props.swing > 100)) {
      throw new Error('Swing must be between 0 and 100');
    }
    
    return props;
  }

  protected equalsCore(other: QuantizeValue): boolean {
    return this.props.type === other.props.type &&
           this.props.swing === other.props.swing;
  }

  // Business methods
  public getTimeValue(bpm: number = 120): number {
    // Convert quantize type to time value in seconds
    const quarterNoteTime = 60 / bpm; // Quarter note duration at given BPM
    
    switch (this.props.type) {
      case QuantizeType.WHOLE:
        return quarterNoteTime * 4;
      case QuantizeType.HALF:
        return quarterNoteTime * 2;
      case QuantizeType.QUARTER:
        return quarterNoteTime;
      case QuantizeType.EIGHTH:
        return quarterNoteTime / 2;
      case QuantizeType.SIXTEENTH:
        return quarterNoteTime / 4;
      case QuantizeType.THIRTY_SECOND:
        return quarterNoteTime / 8;
      case QuantizeType.TRIPLET_QUARTER:
        return (quarterNoteTime * 4) / 3;
      case QuantizeType.TRIPLET_EIGHTH:
        return (quarterNoteTime * 2) / 3;
      case QuantizeType.TRIPLET_SIXTEENTH:
        return quarterNoteTime / 3;
      default:
        return quarterNoteTime;
    }
  }

  public withSwing(swing: number): QuantizeValue {
    return new QuantizeValue({ ...this.props, swing });
  }

  // Getters
  public get type(): QuantizeType {
    return this.props.type;
  }

  public get swing(): number | undefined {
    return this.props.swing;
  }

  public get displayName(): string {
    const swingText = this.props.swing ? ` (${this.props.swing}% swing)` : '';
    return `${this.props.type}${swingText}`;
  }

  public toString(): string {
    return this.props.type;
  }
} 