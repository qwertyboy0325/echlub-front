import { BaseRepository, BaseRepositoryImpl } from './BaseRepository';
import { Track, TrackImpl } from '../models/Track';

/**
 * Track repository interface
 */
export interface TrackRepository extends BaseRepository<Track> {
  /**
   * Get tracks by name
   */
  getByName(name: string): Track[];

  /**
   * Get tracks by type
   */
  getByType(type: 'audio' | 'midi' | 'aux'): Track[];

  /**
   * Get visible tracks
   */
  getVisible(): Track[];

  /**
   * Get muted tracks
   */
  getMuted(): Track[];

  /**
   * Get soloed tracks
   */
  getSoloed(): Track[];

  /**
   * Get tracks with effects
   */
  getWithEffects(): Track[];
}

/**
 * Track repository implementation
 */
export class TrackRepositoryImpl extends BaseRepositoryImpl<Track> implements TrackRepository {
  protected createItem(data: Partial<Track>): Track {
    return new TrackImpl(data);
  }

  protected updateItem(existing: Track, data: Partial<Track>): Track {
    return new TrackImpl({
      ...existing,
      ...data,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
      version: existing.version + 1
    });
  }

  getByName(name: string): Track[] {
    return this.getAll().filter(track => track.name === name);
  }

  getByType(type: 'audio' | 'midi' | 'aux'): Track[] {
    return this.getAll().filter(track => track.type === type);
  }

  getVisible(): Track[] {
    return this.getAll().filter(track => track.visible);
  }

  getMuted(): Track[] {
    return this.getAll().filter(track => track.muted);
  }

  getSoloed(): Track[] {
    return this.getAll().filter(track => track.soloed);
  }

  getWithEffects(): Track[] {
    return this.getAll().filter(track => track.effects.length > 0);
  }
} 