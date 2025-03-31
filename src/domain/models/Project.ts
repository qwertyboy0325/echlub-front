import { BaseModel, BaseModelImpl } from './BaseModel';
import type { Track } from './Track';

/**
 * Project model interface
 */
export interface Project extends BaseModel {
  name: string;
  tempo: number;
  tracks: Track[];
  isCurrent: boolean;
  
  addTrack(track: Track): void;
  removeTrack(trackId: string): void;
  updateTempo(tempo: number): void;
  setCurrent(isCurrent: boolean): void;
}

/**
 * Project model implementation
 */
export class ProjectImpl extends BaseModelImpl implements Project {
  name: string;
  tempo: number;
  tracks: Track[];
  isCurrent: boolean;

  constructor(name: string) {
    super();
    
    this.name = name;
    this.tempo = 120; // Default tempo
    this.tracks = [];
    this.isCurrent = false;
  }

  addTrack(track: Track): void {
    this.tracks.push(track);
    this.incrementVersion();
  }

  removeTrack(trackId: string): void {
    this.tracks = this.tracks.filter(track => track.id !== trackId);
    this.incrementVersion();
  }

  updateTempo(tempo: number): void {
    if (tempo <= 0) {
      throw new Error('Tempo must be greater than 0');
    }
    this.tempo = tempo;
    this.incrementVersion();
  }

  setCurrent(isCurrent: boolean): void {
    this.isCurrent = isCurrent;
    this.incrementVersion();
  }
} 