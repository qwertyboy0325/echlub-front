import type { BaseDTO } from './BaseDTO';
import type { ClipDTO } from './ClipDTO';

export interface TrackDTO extends BaseDTO {
  name: string;
  projectId: string;
  clips: ClipDTO[];
  volume: number;
  pan: number;
  reverb: number;
} 