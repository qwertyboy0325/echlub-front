import type { BaseRepository } from './BaseRepository';
import { injectable, inject } from 'inversify';
import { ClipViewModel } from '../../presentation/models/ClipViewModel';
import { TYPES } from '../../core/di/types';
import type { Storage } from '../../infrastructure/storage/Storage';

export interface ClipRepository extends BaseRepository<ClipViewModel> {
  findByTrackId(trackId: string): Promise<ClipViewModel[]>;
  findByAudioUrl(audioUrl: string): Promise<ClipViewModel[]>;
}

@injectable()
export class ClipRepositoryImpl implements ClipRepository {
  private clips: Map<string, ClipViewModel> = new Map();

  constructor(
    @inject(TYPES.Storage) private storage: Storage
  ) {}

  public async add(clip: ClipViewModel): Promise<void> {
    this.clips.set(clip.id, clip);
    await this.saveToStorage();
  }

  public async get(id: string): Promise<ClipViewModel | undefined> {
    return this.clips.get(id);
  }

  public async getAll(): Promise<ClipViewModel[]> {
    return Array.from(this.clips.values());
  }

  public async update(clip: ClipViewModel): Promise<void> {
    if (!this.clips.has(clip.id)) {
      throw new Error(`Clip with id ${clip.id} not found`);
    }
    this.clips.set(clip.id, clip);
    await this.saveToStorage();
  }

  public async delete(id: string): Promise<void> {
    this.clips.delete(id);
    await this.saveToStorage();
  }

  public async clear(): Promise<void> {
    this.clips.clear();
    await this.saveToStorage();
  }

  public async findByTrackId(trackId: string): Promise<ClipViewModel[]> {
    return Array.from(this.clips.values()).filter(clip => clip.trackId === trackId);
  }

  public async findByAudioUrl(audioUrl: string): Promise<ClipViewModel[]> {
    return Array.from(this.clips.values()).filter(clip => clip.audioUrl === audioUrl);
  }

  private async saveToStorage(): Promise<void> {
    const data = Array.from(this.clips.values());
    await this.storage.set('clips', data);
  }

  private async loadFromStorage(): Promise<void> {
    const data = await this.storage.get<ClipViewModel[]>('clips');
    if (data) {
      this.clips.clear();
      data.forEach(clip => this.clips.set(clip.id, clip));
    }
  }
} 