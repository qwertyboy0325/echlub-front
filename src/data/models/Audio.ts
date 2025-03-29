import { BaseModel, BaseModelImpl } from './BaseModel';

/**
 * Audio model interface
 */
export interface Audio extends BaseModel {
  name: string;
  duration: number;
  sampleRate: number;
  channels: number;
  bitDepth: number;
  filePath: string;
  waveform: number[];
  metadata: Record<string, unknown>;
}

/**
 * Audio model implementation
 */
export class AudioImpl extends BaseModelImpl implements Audio {
  name: string;
  duration: number;
  sampleRate: number;
  channels: number;
  bitDepth: number;
  filePath: string;
  waveform: number[];
  metadata: Record<string, unknown>;

  constructor(data: Partial<Audio>) {
    super(data);
    this.name = data.name || 'Untitled Audio';
    this.duration = data.duration || 0;
    this.sampleRate = data.sampleRate || 44100;
    this.channels = data.channels || 2;
    this.bitDepth = data.bitDepth || 16;
    this.filePath = data.filePath || '';
    this.waveform = data.waveform || [];
    this.metadata = data.metadata || {};
  }

  /**
   * Update audio metadata
   */
  updateMetadata(metadata: Record<string, unknown>): void {
    this.metadata = { ...this.metadata, ...metadata };
    this.update();
  }

  /**
   * Update waveform data
   */
  updateWaveform(waveform: number[]): void {
    this.waveform = waveform;
    this.update();
  }
} 