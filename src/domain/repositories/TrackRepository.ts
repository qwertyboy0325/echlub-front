import { injectable, inject } from 'inversify';
import type { Track } from '../models/Track';
import type { BaseRepository } from './BaseRepository';
import { TYPES } from '../../core/di/types';
import type { Storage } from '../../infrastructure/storage/Storage';

export interface TrackRepository extends BaseRepository<Track> {
  findByProjectId(projectId: string): Promise<Track[]>;
  findByClipId(clipId: string): Promise<Track[]>;
}

@injectable()
export class TrackRepositoryImpl implements TrackRepository {
  private tracks: Map<string, Track> = new Map();

  constructor(
    @inject(TYPES.Storage) private storage: Storage
  ) {}

  public async add(track: Track): Promise<void> {
    this.tracks.set(track.id, track);
    await this.saveToStorage();
  }

  public async get(id: string): Promise<Track | undefined> {
    return this.tracks.get(id);
  }

  public async getAll(): Promise<Track[]> {
    return Array.from(this.tracks.values());
  }

  public async update(track: Track): Promise<void> {
    if (!this.tracks.has(track.id)) {
      throw new Error(`Track with id ${track.id} not found`);
    }
    this.tracks.set(track.id, track);
    await this.saveToStorage();
  }

  public async delete(id: string): Promise<void> {
    this.tracks.delete(id);
    await this.saveToStorage();
  }

  public async clear(): Promise<void> {
    this.tracks.clear();
    await this.saveToStorage();
  }

  public async findByProjectId(projectId: string): Promise<Track[]> {
    return Array.from(this.tracks.values()).filter(track => track.projectId === projectId);
  }

  public async findByClipId(clipId: string): Promise<Track[]> {
    return Array.from(this.tracks.values()).filter(track => 
      track.clips.some(clip => clip.id === clipId)
    );
  }

  private async saveToStorage(): Promise<void> {
    const data = Array.from(this.tracks.values());
    await this.storage.set('tracks', data);
  }

  private async loadFromStorage(): Promise<void> {
    const data = await this.storage.get<Track[]>('tracks');
    if (data) {
      this.tracks.clear();
      data.forEach(track => this.tracks.set(track.id, track));
    }
  }
} 