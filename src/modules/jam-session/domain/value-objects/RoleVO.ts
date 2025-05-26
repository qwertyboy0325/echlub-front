import { ValueObject } from '@/core/value-objects/ValueObject';

interface RoleProps {
  id: string;
  name: string;
  color: string;
  isUnique: boolean;
}

/**
 * 角色值對象
 * 代表一個玩家可以選擇的角色
 */
export class RoleVO extends ValueObject<RoleProps> {
  private constructor(props: RoleProps) {
    super(props);
  }

  public static create(
    id: string,
    name: string,
    color: string,
    isUnique: boolean = true
  ): RoleVO {
    if (!id || !name || !color) {
      throw new Error('Role properties cannot be empty');
    }
    return new RoleVO({ id, name, color, isUnique });
  }

  protected validateProps(props: RoleProps): RoleProps {
    if (!props.id || !props.name || !props.color) {
      throw new Error('Role properties cannot be empty');
    }
    return props;
  }

  protected equalsCore(other: RoleVO): boolean {
    return this.props.id === other.props.id;
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get color(): string {
    return this.props.color;
  }

  isUnique(): boolean {
    return this.props.isUnique;
  }

  /**
   * 使用新的顏色創建一個新的角色實例
   */
  withColor(color: string): RoleVO {
    if (!color) {
      throw new Error('Color cannot be empty');
    }
    return new RoleVO({
      ...this.props,
      color
    });
  }

  /**
   * 使用新的名稱創建一個新的角色實例
   */
  withName(name: string): RoleVO {
    if (!name) {
      throw new Error('Name cannot be empty');
    }
    return new RoleVO({
      ...this.props,
      name
    });
  }

  toJSON(): object {
    return {
      id: this.props.id,
      name: this.props.name,
      color: this.props.color,
      isUnique: this.props.isUnique
    };
  }

  toString(): string {
    return `Role(${this.props.name})`;
  }
} 