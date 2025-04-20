import { v4 as uuidv4 } from 'uuid';

export class ClipId {
  private constructor(private readonly value: string) {
    if (!value) throw new Error('Clip ID cannot be empty');
  }
  
  static create(): ClipId {
    return new ClipId(uuidv4());
  }

  static generate(): ClipId {
    return new ClipId(crypto.randomUUID());
  }

  static fromString(id: string): ClipId {
    return new ClipId(id);
  }

  toString(): string {
    return this.value;
  }

  equals(other: ClipId): boolean {
    return this.value === other.value;
  }
} 