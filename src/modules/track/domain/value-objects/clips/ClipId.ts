import { v4 as uuidv4, validate as uuidValidate } from 'uuid';
import { IValueObject } from '../../interfaces/IValueObject';

export class ClipId implements IValueObject {
  protected constructor(protected readonly value: string) {
    if (!value) throw new Error('Clip ID cannot be empty');
  }

  equals(other: IValueObject): boolean {
    return other instanceof ClipId && this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  toJSON(): object {
    return {
      value: this.value
    };
  }

  static create(): ClipId {
    return new ClipId(uuidv4());
  }

  static fromString(value: string): ClipId {
    if (!value) throw new Error('Clip ID cannot be empty');
    if (!uuidValidate(value)) throw new Error('Invalid Clip ID format');
    return new ClipId(value);
  }
} 