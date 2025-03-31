import type { Audio } from '../models/Audio';
import type { BaseRepository } from './BaseRepository';

export interface AudioRepository extends BaseRepository<Audio> {
  findByUrl(url: string): Promise<Audio | null>;
  findByFormat(format: string): Promise<Audio[]>;
} 