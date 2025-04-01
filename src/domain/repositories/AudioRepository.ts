import type { Audio } from '../models/Audio';
import type { BaseRepository } from './BaseRepository';
import { injectable } from 'inversify';

export interface AudioResource {
  id: string;
  url: string;
  name: string;
  duration: number;
  waveformData?: Float32Array;
  metadata?: {
    bpm?: number;
    key?: string;
    tags?: string[];
  };
}

@injectable()
export class AudioRepository {
  private audioResources: Map<string, AudioResource> = new Map();

  public async addAudioResource(resource: AudioResource): Promise<void> {
    this.audioResources.set(resource.id, resource);
  }

  public async getAudioResource(id: string): Promise<AudioResource | undefined> {
    return this.audioResources.get(id);
  }

  public async getAllAudioResources(): Promise<AudioResource[]> {
    return Array.from(this.audioResources.values());
  }

  public async updateAudioResource(resource: AudioResource): Promise<void> {
    if (!this.audioResources.has(resource.id)) {
      throw new Error(`Audio resource with id ${resource.id} not found`);
    }
    this.audioResources.set(resource.id, resource);
  }

  public async deleteAudioResource(id: string): Promise<void> {
    const resource = this.audioResources.get(id);
    if (resource) {
      URL.revokeObjectURL(resource.url);
      this.audioResources.delete(id);
    }
  }

  public async clear(): Promise<void> {
    // 清理所有 URL
    for (const resource of this.audioResources.values()) {
      URL.revokeObjectURL(resource.url);
    }
    this.audioResources.clear();
  }

  public async getAudioResourceByUrl(url: string): Promise<AudioResource | undefined> {
    return Array.from(this.audioResources.values()).find(
      resource => resource.url === url
    );
  }
} 