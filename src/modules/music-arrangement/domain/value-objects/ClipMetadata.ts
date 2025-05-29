import { ValueObject } from '../../../../core/value-objects/ValueObject';

export interface ClipMetadataProps {
  name: string;
  color?: string;
  tags?: string[];
  description?: string;
}

/**
 * Clip metadata value object
 * Contains descriptive information about a clip
 */
export class ClipMetadata extends ValueObject<ClipMetadataProps> {
  constructor(props: ClipMetadataProps) {
    super(props);
  }

  public static create(name: string, options?: Partial<ClipMetadataProps>): ClipMetadata {
    return new ClipMetadata({
      name,
      color: options?.color,
      tags: options?.tags || [],
      description: options?.description
    });
  }

  protected validateProps(props: ClipMetadataProps): ClipMetadataProps {
    if (!props.name || props.name.trim() === '') {
      throw new Error('Clip name cannot be empty');
    }
    return {
      ...props,
      name: props.name.trim(),
      tags: props.tags || []
    };
  }

  protected equalsCore(other: ClipMetadata): boolean {
    return this.props.name === other.props.name &&
           this.props.color === other.props.color &&
           this.props.description === other.props.description &&
           JSON.stringify(this.props.tags) === JSON.stringify(other.props.tags);
  }

  // Getters
  public get name(): string {
    return this.props.name;
  }

  public get color(): string | undefined {
    return this.props.color;
  }

  public get tags(): string[] {
    return this.props.tags || [];
  }

  public get description(): string | undefined {
    return this.props.description;
  }

  // Business methods
  public withName(name: string): ClipMetadata {
    return new ClipMetadata({ ...this.props, name });
  }

  public withColor(color: string): ClipMetadata {
    return new ClipMetadata({ ...this.props, color });
  }

  public withDescription(description: string): ClipMetadata {
    return new ClipMetadata({ ...this.props, description });
  }

  public addTag(tag: string): ClipMetadata {
    const tags = [...this.tags];
    if (!tags.includes(tag)) {
      tags.push(tag);
    }
    return new ClipMetadata({ ...this.props, tags });
  }

  public removeTag(tag: string): ClipMetadata {
    const tags = this.tags.filter(t => t !== tag);
    return new ClipMetadata({ ...this.props, tags });
  }
} 