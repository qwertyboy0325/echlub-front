import { UniqueId } from '../../../../core/value-objects/UniqueId';

/**
 * Track unique identifier
 * Extends core UniqueId for consistent ID management
 */
export class TrackId extends UniqueId<string> {
  private constructor(value: string) {
    super(value);
  }

  public static create(): TrackId {
    return new TrackId(crypto.randomUUID());
  }

  public static fromString(value: string): TrackId {
    return new TrackId(value);
  }

  protected validateProps(props: { value: string }): { value: string } {
    if (!props.value || props.value.trim() === '') {
      throw new Error('TrackId cannot be empty');
    }
    return props;
  }
} 