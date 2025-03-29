import { BaseRepository, BaseRepositoryImpl } from './BaseRepository';
import { Clip, ClipImpl } from '../models/Clip';

/**
 * Clip repository interface
 */
export interface ClipRepository extends BaseRepository<Clip> {
  /**
   * Get clips by audio ID
   */
  getByAudioId(audioId: string): Clip[];

  /**
   * Get clips by name
   */
  getByName(name: string): Clip[];

  /**
   * Get clips in time range
   */
  getInTimeRange(startTime: number, endTime: number): Clip[];

  /**
   * Get clips by track ID
   */
  getByTrackId(trackId: string): Clip[];
}

/**
 * Clip repository implementation
 */
export class ClipRepositoryImpl extends BaseRepositoryImpl<Clip> implements ClipRepository {
  protected createItem(data: Partial<Clip>): Clip {
    return new ClipImpl(data);
  }

  protected updateItem(existing: Clip, data: Partial<Clip>): Clip {
    return new ClipImpl({
      ...existing,
      ...data,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
      version: existing.version + 1
    });
  }

  getByAudioId(audioId: string): Clip[] {
    return this.getAll().filter(clip => clip.audioId === audioId);
  }

  getByName(name: string): Clip[] {
    return this.getAll().filter(clip => clip.name === name);
  }

  getInTimeRange(startTime: number, endTime: number): Clip[] {
    return this.getAll().filter(clip => {
      const clipEnd = clip.startTime + clip.duration;
      return clip.startTime <= endTime && clipEnd >= startTime;
    });
  }

  getByTrackId(trackId: string): Clip[] {
    // This method will be implemented when we have track-clip relationship
    return [];
  }
} 