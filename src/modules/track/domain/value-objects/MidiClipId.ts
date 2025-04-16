export class MidiClipId {
  constructor(private readonly value: string) {}

  equals(other: MidiClipId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  static create(): MidiClipId {
    if (typeof crypto === 'undefined' || !crypto.randomUUID) {
      return new MidiClipId('test-midi-clip-id-' + Math.random().toString(36).substr(2, 9));
    }
    return new MidiClipId(crypto.randomUUID());
  }
} 