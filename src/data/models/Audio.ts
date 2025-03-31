import { BaseModelImpl } from './BaseModel';

export class AudioImpl extends BaseModelImpl {
  constructor(
    public name: string,
    public url: string,
    public duration: number,
    public sampleRate: number,
    public channels: number,
    public format: string,
    public metadata: Record<string, any> = {}
  ) {
    super();

    if (sampleRate <= 0) {
      throw new Error('Sample rate must be positive');
    }

    if (channels <= 0) {
      throw new Error('Channels must be positive');
    }

    if (duration < 0) {
      throw new Error('Duration must be non-negative');
    }
  }

  updateMetadata(newMetadata: Record<string, any>): void {
    this.metadata = { ...this.metadata, ...newMetadata };
    this.incrementVersion();
  }

  updateDuration(newDuration: number): void {
    if (newDuration < 0) {
      throw new Error('Duration must be non-negative');
    }
    this.duration = newDuration;
    this.incrementVersion();
  }
} 