import type { Track } from '../models/Track';
import type { BaseRepository } from './BaseRepository';

export interface TrackRepository extends BaseRepository<Track> {
  findByProjectId(projectId: string): Promise<Track[]>;
  findByClipId(clipId: string): Promise<Track[]>;
} 