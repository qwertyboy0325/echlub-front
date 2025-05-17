import { v4 as uuidv4, validate as validateUUID } from 'uuid';

export class TrackId {
  private constructor(private readonly value: string) {}

  static create(): TrackId {
    return new TrackId(uuidv4());
  }

  static fromString(value: string): TrackId {
    if (!value || !validateUUID(value)) {
      throw new Error('Invalid track ID format');
    }
    return new TrackId(value);
  }

  toString(): string {
    return this.value;
  }

  equals(other: TrackId): boolean {
    return this.value === other.value;
  }
} 
