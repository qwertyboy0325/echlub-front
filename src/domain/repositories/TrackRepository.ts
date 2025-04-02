import { injectable, inject } from 'inversify';
import type { Track } from '../models/Track';
import type { BaseRepository } from './BaseRepository';
import { TYPES } from '../../core/di/types';
import type { Storage } from '../../infrastructure/storage/Storage';
import { DomainEventBus } from '../../core/events/DomainEventBus';
import { Track as TrackEntity } from '../entities/Track';

export interface TrackRepository {
  create(track: Omit<Track, 'id'>): Promise<Track>;
  findById(id: string): Promise<Track | null>;
  findAll(): Promise<Track[]>;
  update(id: string, track: Partial<Track>): Promise<Track>;
  delete(id: string): Promise<void>;
  clear(): Promise<void>;
}

@injectable()
export class TrackRepositoryImpl implements TrackRepository {
  private tracks: Map<string, TrackEntity> = new Map();
  private nextTrackNumber: number = 1;

  constructor(
    @inject(TYPES.Storage) private storage: Storage,
    @inject(TYPES.DomainEventBus) private domainEventBus: DomainEventBus
  ) {}

  async create(track: Omit<Track, 'id'>): Promise<Track> {
    const id = crypto.randomUUID();
    const newTrack: Track = {
      ...track,
      id
    };
    
    this.tracks.set(id, newTrack);
    return newTrack;
  }

  async findById(id: string): Promise<Track | null> {
    return this.tracks.get(id) || null;
  }

  async findAll(): Promise<Track[]> {
    return Array.from(this.tracks.values());
  }

  async update(id: string, track: Partial<Track>): Promise<Track> {
    const existingTrack = await this.findById(id);
    if (!existingTrack) {
      throw new Error(`Track not found: ${id}`);
    }
    
    const updatedTrack: Track = {
      ...existingTrack,
      ...track
    };
    
    this.tracks.set(id, updatedTrack);
    await this.saveToStorage();
    return updatedTrack;
  }

  async delete(id: string): Promise<void> {
    const track = this.tracks.get(id);
    if (track) {
      this.tracks.delete(id);
      this.domainEventBus.emit('domain:track:deleted', { trackId: id });
    }
    await this.saveToStorage();
  }

  async clear(): Promise<void> {
    this.tracks.clear();
    await this.saveToStorage();
  }

  private async saveToStorage(): Promise<void> {
    const data = Array.from(this.tracks.values());
    await this.storage.set('tracks', data);
  }

  private async loadFromStorage(): Promise<void> {
    const data = await this.storage.get<TrackEntity[]>('tracks');
    if (data) {
      this.tracks.clear();
      data.forEach(track => this.tracks.set(track.id, track));
    }
  }
} 