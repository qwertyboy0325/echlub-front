import type { BaseDTO } from './BaseDTO';
import type { TrackDTO } from './TrackDTO';

export interface ProjectDTO extends BaseDTO {
  name: string;
  tempo: number;
  tracks: TrackDTO[];
  isCurrent: boolean;
} 