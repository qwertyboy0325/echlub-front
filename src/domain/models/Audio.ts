import { BaseModel, BaseModelImpl } from './BaseModel';

/**
 * Audio model interface
 */
export interface Audio extends BaseModel {
  name: string;
  url: string;
  duration: number;
  sampleRate: number;
  channels: number;
  format: string;
  metadata: Record<string, any>;
  
  updateMetadata(metadata: Record<string, any>): void;
  updateDuration(duration: number): void;
}

/**
 * Audio model implementation
 */
export class AudioImpl extends BaseModelImpl implements Audio {
  name: string;
  url: string;
  duration: number;
  sampleRate: number;
  channels: number;
  format: string;
  metadata: Record<string, any>;

  constructor(
    name: string,
    url: string,
    duration: number,
    sampleRate: number,
    channels: number,
    format: string
  ) {
    super();
    
    this.name = name;
    this.url = url;
    this.duration = duration;
    this.sampleRate = sampleRate;
    this.channels = channels;
    this.format = format;
    this.metadata = {};
  }

  updateMetadata(metadata: Record<string, any>): void {
    this.metadata = metadata;
    this.incrementVersion();
  }

  updateDuration(duration: number): void {
    if (duration < 0) {
      throw new Error('Duration must be non-negative');
    }
    this.duration = duration;
    this.incrementVersion();
  }
} 