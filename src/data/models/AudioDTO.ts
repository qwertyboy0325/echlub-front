import type { BaseModel } from '../../domain/models/BaseModel';

export interface AudioDTO extends BaseModel {
  name: string;
  url: string;
  duration: number;
  sampleRate: number;
  channels: number;
  format: string;
  metadata: Record<string, any>;
} 