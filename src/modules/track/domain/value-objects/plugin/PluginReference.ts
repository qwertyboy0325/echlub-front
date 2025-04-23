import { IValueObject } from '../../interfaces/IValueObject';
import { IPluginReference } from '../../interfaces/IPluginReference';

export class PluginReference implements IValueObject, IPluginReference {
  constructor(private readonly id: string) {
    if (!id) throw new Error('Plugin ID cannot be empty');
  }

  getId(): string {
    return this.id;
  }

  equals(other: IValueObject): boolean {
    if (!(other instanceof PluginReference)) {
      return false;
    }
    return this.id === other.id;
  }

  toString(): string {
    return this.id;
  }

  toJSON(): object {
    return {
      id: this.id
    };
  }
} 