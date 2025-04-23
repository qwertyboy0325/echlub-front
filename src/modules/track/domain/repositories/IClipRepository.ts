import { BaseClip } from '../entities/clips/BaseClip';
import { ClipId } from '../value-objects/clips/ClipId';

export interface IClipRepository {
  findById(id: ClipId): Promise<BaseClip | null>;
  save(clip: BaseClip): Promise<void>;
  delete(id: ClipId): Promise<void>;
} 