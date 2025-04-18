import { v4 as uuidv4 } from 'uuid';

export class PluginInstanceId {
  private constructor(private readonly value: string) {}

  static create(): PluginInstanceId {
    return new PluginInstanceId(uuidv4());
  }

  static fromString(id: string): PluginInstanceId {
    return new PluginInstanceId(id);
  }

  toString(): string {
    return this.value;
  }

  equals(other: PluginInstanceId): boolean {
    return this.value === other.value;
  }
} 