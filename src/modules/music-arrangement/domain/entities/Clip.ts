import { Entity } from '../../../../core/entities/Entity';
import { ClipId } from '../value-objects/ClipId';
import { TimeRangeVO } from '../value-objects/TimeRangeVO';
import { ClipMetadata } from '../value-objects/ClipMetadata';
import { ClipType } from '../value-objects/ClipType';

/**
 * Abstract Clip Entity
 * Base class for all clip types (Audio, MIDI)
 */
export abstract class Clip extends Entity<ClipId> {
  protected constructor(
    clipId: ClipId,
    protected _range: TimeRangeVO,
    protected _metadata: ClipMetadata,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    super(clipId, createdAt, updatedAt);
  }

  // Common clip operations
  public moveToRange(newRange: TimeRangeVO): void {
    this.validateRange(newRange);
    this._range = newRange;
    this.updateTimestamp();
  }

  public updateMetadata(metadata: ClipMetadata): void {
    this._metadata = metadata;
    this.updateTimestamp();
  }

  // Abstract methods that must be implemented by subclasses
  public abstract getType(): ClipType;
  public abstract getDuration(): number;
  public abstract clone(): Clip;

  // Validation
  protected validateRange(range: TimeRangeVO): void {
    if (range.start < 0) {
      throw new Error('Clip start time cannot be negative');
    }
    if (range.length <= 0) {
      throw new Error('Clip length must be positive');
    }
  }

  // Getters
  public get range(): TimeRangeVO { 
    return this._range; 
  }

  public get metadata(): ClipMetadata { 
    return this._metadata; 
  }

  public get clipId(): ClipId { 
    return this.id; 
  }

  public get startTime(): number {
    return this._range.start;
  }

  public get endTime(): number {
    return this._range.end;
  }

  public get length(): number {
    return this._range.length;
  }

  public get name(): string {
    return this._metadata.name;
  }

  // Business methods
  public intersects(other: Clip): boolean {
    return this._range.intersects(other._range);
  }

  public contains(timePoint: number): boolean {
    return timePoint >= this.startTime && timePoint < this.endTime;
  }
} 