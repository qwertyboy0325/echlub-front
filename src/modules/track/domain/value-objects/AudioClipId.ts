export class AudioClipId {
  constructor(private readonly value: string) {}

  equals(other: AudioClipId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  static create(): AudioClipId {
    if (typeof crypto === 'undefined' || !crypto.randomUUID) {
      return new AudioClipId('test-audio-clip-id-' + Math.random().toString(36).substr(2, 9));
    }
    return new AudioClipId(crypto.randomUUID());
  }
} 