import { ValueObject } from '../../../../core/value-objects/ValueObject';

export interface TrackMetadataProps {
  name: string;
  color?: string;
  volume?: number;
  pan?: number;
  muted?: boolean;
  solo?: boolean;
  description?: string;
  tags?: string[];
}

/**
 * Track metadata value object
 * Contains descriptive and control information about a track
 */
export class TrackMetadata extends ValueObject<TrackMetadataProps> {
  constructor(props: TrackMetadataProps) {
    super(props);
  }

  public static create(name: string, options?: Partial<TrackMetadataProps>): TrackMetadata {
    return new TrackMetadata({
      name,
      color: options?.color,
      volume: options?.volume ?? 1.0,
      pan: options?.pan ?? 0.0,
      muted: options?.muted ?? false,
      solo: options?.solo ?? false,
      description: options?.description,
      tags: options?.tags || []
    });
  }

  protected validateProps(props: TrackMetadataProps): TrackMetadataProps {
    if (!props.name || props.name.trim() === '') {
      throw new Error('Track name cannot be empty');
    }
    
    if (props.volume !== undefined && (props.volume < 0 || props.volume > 2)) {
      throw new Error('Volume must be between 0 and 2');
    }
    
    if (props.pan !== undefined && (props.pan < -1 || props.pan > 1)) {
      throw new Error('Pan must be between -1 and 1');
    }
    
    return {
      ...props,
      name: props.name.trim(),
      volume: props.volume ?? 1.0,
      pan: props.pan ?? 0.0,
      muted: props.muted ?? false,
      solo: props.solo ?? false,
      tags: props.tags || []
    };
  }

  protected equalsCore(other: TrackMetadata): boolean {
    return this.props.name === other.props.name &&
           this.props.color === other.props.color &&
           this.props.volume === other.props.volume &&
           this.props.pan === other.props.pan &&
           this.props.muted === other.props.muted &&
           this.props.solo === other.props.solo &&
           this.props.description === other.props.description &&
           JSON.stringify(this.props.tags) === JSON.stringify(other.props.tags);
  }

  // Business methods
  public withName(name: string): TrackMetadata {
    return new TrackMetadata({ ...this.props, name });
  }

  public withColor(color: string): TrackMetadata {
    return new TrackMetadata({ ...this.props, color });
  }

  public withVolume(volume: number): TrackMetadata {
    return new TrackMetadata({ ...this.props, volume });
  }

  public withPan(pan: number): TrackMetadata {
    return new TrackMetadata({ ...this.props, pan });
  }

  public withMuted(muted: boolean): TrackMetadata {
    return new TrackMetadata({ ...this.props, muted });
  }

  public withSolo(solo: boolean): TrackMetadata {
    return new TrackMetadata({ ...this.props, solo });
  }

  public withDescription(description: string): TrackMetadata {
    return new TrackMetadata({ ...this.props, description });
  }

  public addTag(tag: string): TrackMetadata {
    const tags = [...this.tags];
    if (!tags.includes(tag)) {
      tags.push(tag);
    }
    return new TrackMetadata({ ...this.props, tags });
  }

  public removeTag(tag: string): TrackMetadata {
    const tags = this.tags.filter(t => t !== tag);
    return new TrackMetadata({ ...this.props, tags });
  }

  // Getters
  public get name(): string {
    return this.props.name;
  }

  public get color(): string | undefined {
    return this.props.color;
  }

  public get volume(): number {
    return this.props.volume ?? 1.0;
  }

  public get pan(): number {
    return this.props.pan ?? 0.0;
  }

  public get muted(): boolean {
    return this.props.muted ?? false;
  }

  public get solo(): boolean {
    return this.props.solo ?? false;
  }

  public get description(): string | undefined {
    return this.props.description;
  }

  public get tags(): string[] {
    return this.props.tags || [];
  }

  // State queries
  public isAudible(): boolean {
    return !this.muted;
  }

  public isSilenced(): boolean {
    return this.muted || this.volume === 0;
  }
} 