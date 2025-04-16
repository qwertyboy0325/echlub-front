export class ClipId {
  constructor(private readonly value: string) {}

  equals(other: ClipId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  static create(): ClipId {
    if (typeof crypto === 'undefined' || !crypto.randomUUID) {
      return new ClipId('test-clip-id-' + Math.random().toString(36).substr(2, 9));
    }
    return new ClipId(crypto.randomUUID());
  }
} 