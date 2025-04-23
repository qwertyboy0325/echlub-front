import { injectable } from 'inversify';
import { IClipRepository } from '../../domain/repositories/IClipRepository';
import { BaseClip } from '../../domain/entities/clips/BaseClip';
import { ClipId } from '../../domain/value-objects/clips/ClipId';

@injectable()
export class LocalClipRepository implements IClipRepository {
  private clips: Map<string, BaseClip> = new Map();

  async findById(id: ClipId): Promise<BaseClip | null> {
    const clip = this.clips.get(id.toString());
    return clip || null;
  }

  async save(clip: BaseClip): Promise<void> {
    this.clips.set(clip.getId(), clip);
  }

  async delete(id: ClipId): Promise<void> {
    this.clips.delete(id.toString());
  }
} 