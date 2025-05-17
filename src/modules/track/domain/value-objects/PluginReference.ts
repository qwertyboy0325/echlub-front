import { IPluginReference } from '../interfaces/IPluginReference';

export class PluginReference implements IPluginReference {
  private constructor(public readonly id: string) {}

  static create(id: string): PluginReference {
    return new PluginReference(id);
  }

  equals(other: IPluginReference): boolean {
    return this.id === other.id;
  }

  toString(): string {
    return this.id;
  }
} 
