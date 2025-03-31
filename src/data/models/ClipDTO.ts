import type { BaseDTO } from './BaseDTO';
import type { AudioDTO } from './AudioDTO';

export interface ClipDTO extends BaseDTO {
  name: string;
  trackId: string;
  audioUrl: string;
  startTime: number;
  duration: number;
  position: number;
  volume: number;
  pan: number;
  muted: boolean;
  soloed: boolean;
  effects: string[];
  automation: Record<string, number[]>;
} 