import { v4 as uuidv4, validate as uuidValidate } from 'uuid';

export class TrackId {
  private constructor(private readonly id: string) {
    if (!id) throw new Error('Track ID cannot be empty');
  }

  static create(): TrackId {
    return new TrackId(uuidv4());
  }

  static fromString(id: string): TrackId {
    if (!id) throw new Error('Track ID cannot be empty');
    if (!uuidValidate(id)) throw new Error('Invalid Track ID format');
    return new TrackId(id);
  }

  toString(): string {
    return this.id;
  }

  equals(other: TrackId): boolean {
    if (!(other instanceof TrackId)) return false;
    return this.id === other.id;
  }
} 