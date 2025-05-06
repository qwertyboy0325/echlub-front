import { v4 as uuidv4 } from 'uuid';
import { IPluginReference } from '../../../track/domain/interfaces/IPluginReference';

export class PluginInstanceId implements IPluginReference {
  private constructor(private readonly value: string) {}

  get id(): string {
    return this.value;
  }

  static create(): PluginInstanceId {
    return new PluginInstanceId(uuidv4());
  }

  static fromString(id: string): PluginInstanceId {
    return new PluginInstanceId(id);
  }

  toString(): string {
    return this.value;
  }

  equals(other: IPluginReference): boolean {
    if (other instanceof PluginInstanceId) {
      return this.value === other.value;
    }
    return this.value === other.id;
  }
} 