export class PluginInstanceId {
  constructor(private readonly value: string) {}

  equals(other: PluginInstanceId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  static create(): PluginInstanceId {
    if (typeof crypto === 'undefined' || !crypto.randomUUID) {
      return new PluginInstanceId('test-plugin-id-' + Math.random().toString(36).substr(2, 9));
    }
    return new PluginInstanceId(crypto.randomUUID());
  }
} 