import { v4 as uuidv4 } from 'uuid';

export abstract class ClipId {
  protected constructor(protected readonly value: string) {}

  equals(other: ClipId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  static create(): ClipId {
    throw new Error('Cannot create abstract ClipId directly');
  }
} 