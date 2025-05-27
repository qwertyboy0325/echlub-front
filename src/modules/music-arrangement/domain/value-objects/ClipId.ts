import { UniqueId } from '../../../../core/value-objects/UniqueId';

/**
 * Clip unique identifier
 * Extends core UniqueId for consistent ID management
 */
export class ClipId extends UniqueId<string> {
  private constructor(value: string) {
    super(value);
  }

  public static create(): ClipId {
    return new ClipId(crypto.randomUUID());
  }

  public static fromString(value: string): ClipId {
    return new ClipId(value);
  }

  protected validateProps(props: { value: string }): { value: string } {
    if (!props.value || props.value.trim() === '') {
      throw new Error('ClipId cannot be empty');
    }
    return props;
  }
} 