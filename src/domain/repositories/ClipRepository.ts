import type { Clip } from '../models/Clip';
import type { BaseRepository } from './BaseRepository';

export interface ClipRepository extends BaseRepository<Clip> {
  findByTrackId(trackId: string): Promise<Clip[]>;
  findByAudioUrl(audioUrl: string): Promise<Clip[]>;
} 