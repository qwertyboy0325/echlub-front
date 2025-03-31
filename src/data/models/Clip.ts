import { BaseModelImpl } from './BaseModel';

export class ClipImpl extends BaseModelImpl {
  constructor(
    public name: string,
    public audioId: string,
    public trackId: string,
    public startTime: number,
    public duration: number,
    public volume: number = 1
  ) {
    super();

    if (startTime < 0) {
      throw new Error('Start time must be non-negative');
    }

    if (duration <= 0) {
      throw new Error('Duration must be positive');
    }

    if (volume < 0 || volume > 1) {
      throw new Error('Volume must be between 0 and 1');
    }
  }

  updatePosition(newStartTime: number): void {
    if (newStartTime < 0) {
      throw new Error('Start time must be non-negative');
    }
    this.startTime = newStartTime;
    this.incrementVersion();
  }

  updateVolume(newVolume: number): void {
    if (newVolume < 0 || newVolume > 1) {
      throw new Error('Volume must be between 0 and 1');
    }
    this.volume = newVolume;
    this.incrementVersion();
  }
} 