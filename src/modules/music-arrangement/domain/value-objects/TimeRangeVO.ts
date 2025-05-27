import { ValueObject } from '../../../../core/value-objects/ValueObject';
import type { QuantizeValue } from './QuantizeValue';

export interface TimeRangeProps {
  start: number;
  length: number;
}

/**
 * Time range value object
 * Represents a time segment with start and length
 */
export class TimeRangeVO extends ValueObject<TimeRangeProps> {
  constructor(start: number, length: number) {
    super({ start, length });
  }

  protected validateProps(props: TimeRangeProps): TimeRangeProps {
    if (props.start < 0) {
      throw new Error('Start time cannot be negative');
    }
    if (props.length <= 0) {
      throw new Error('Length must be positive');
    }
    return props;
  }

  protected equalsCore(other: TimeRangeVO): boolean {
    return this.props.start === other.props.start && 
           this.props.length === other.props.length;
  }

  // Getters
  public get start(): number { 
    return this.props.start; 
  }

  public get length(): number { 
    return this.props.length; 
  }

  public get end(): number { 
    return this.props.start + this.props.length; 
  }

  // Business methods
  public intersects(other: TimeRangeVO): boolean {
    return this.start < other.end && this.end > other.start;
  }

  public contains(other: TimeRangeVO): boolean {
    return this.start <= other.start && this.end >= other.end;
  }

  public shift(offset: number): TimeRangeVO {
    return new TimeRangeVO(this.start + offset, this.length);
  }

  public withStart(newStart: number): TimeRangeVO {
    return new TimeRangeVO(newStart, this.length);
  }

  public withLength(newLength: number): TimeRangeVO {
    return new TimeRangeVO(this.start, newLength);
  }

  public quantize(quantizeValue: QuantizeValue, bpm: number = 120): TimeRangeVO {
    const gridSize = quantizeValue.getTimeValue(bpm);
    
    // Quantize start time to nearest grid
    const quantizedStart = Math.round(this.start / gridSize) * gridSize;
    
    // Keep original length for now (could also quantize length if needed)
    return new TimeRangeVO(quantizedStart, this.length);
  }

  public toString(): string {
    return `TimeRange(${this.start}, ${this.length})`;
  }
} 