export class WaveformData {
  constructor(
    private readonly peaks: Float32Array,
    private readonly resolution: number
  ) {
    if (resolution <= 0) {
      throw new Error('Resolution must be positive');
    }
  }

  getPeaks(): Float32Array {
    return this.peaks;
  }

  getResolution(): number {
    return this.resolution;
  }

  equals(other: WaveformData): boolean {
    if (this.resolution !== other.resolution) return false;
    if (this.peaks.length !== other.peaks.length) return false;
    return this.peaks.every((value, index) => value === other.peaks[index]);
  }

  toJSON(): object {
    return {
      peaks: Array.from(this.peaks),
      resolution: this.resolution
    };
  }
} 