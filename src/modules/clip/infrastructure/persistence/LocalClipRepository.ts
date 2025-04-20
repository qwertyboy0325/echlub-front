import { injectable } from 'inversify';
import { ILocalClipRepository } from '../../domain/repositories/IClipRepository';
import { BaseClip } from '../../domain/entities/BaseClip';
import { ClipId } from '../../domain/value-objects/ClipId';

@injectable()
export class LocalClipRepository implements ILocalClipRepository {
  private clips: Map<string, BaseClip> = new Map();

  async create(clip: BaseClip): Promise<void> {
    this.clips.set(clip.getId(), clip);
  }

  async findById(id: ClipId): Promise<BaseClip | undefined> {
    return this.clips.get(id.toString());
  }

  async save(clip: BaseClip): Promise<void> {
    this.clips.set(clip.getId(), clip);
  }

  async delete(id: ClipId): Promise<void> {
    this.clips.delete(id.toString());
  }

  // 本地特定的方法
  async clear(): Promise<void> {
    this.clips.clear();
  }

  async getAll(): Promise<BaseClip[]> {
    return Array.from(this.clips.values());
  }
} 