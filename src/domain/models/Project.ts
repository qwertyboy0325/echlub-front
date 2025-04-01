import type { Track } from './Track';

/**
 * Project model interface
 */
export interface Project {
  id: string;
  name: string;
  bpm: number;
  timeSignature: {
    numerator: number;
    denominator: number;
  };
  tracks: Track[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Project model implementation
 */
export class ProjectImpl implements Project {
  public id: string;
  public name: string;
  public bpm: number;
  public timeSignature: {
    numerator: number;
    denominator: number;
  };
  public tracks: Track[];
  public createdAt: Date;
  public updatedAt: Date;

  constructor(name: string, id?: string) {
    this.id = id || crypto.randomUUID();
    this.name = name;
    this.bpm = 120;
    this.timeSignature = {
      numerator: 4,
      denominator: 4
    };
    this.tracks = [];
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  public addTrack(track: Track): void {
    this.tracks.push(track);
    this.updatedAt = new Date();
  }

  public removeTrack(trackId: string): void {
    this.tracks = this.tracks.filter(track => track.id !== trackId);
    this.updatedAt = new Date();
  }

  public updateBPM(bpm: number): void {
    if (bpm <= 0) {
      throw new Error('BPM must be greater than 0');
    }
    this.bpm = bpm;
    this.updatedAt = new Date();
  }

  public updateTimeSignature(numerator: number, denominator: number): void {
    if (numerator <= 0 || denominator <= 0) {
      throw new Error('Time signature components must be greater than 0');
    }
    this.timeSignature = { numerator, denominator };
    this.updatedAt = new Date();
  }
} 