import { BaseClip } from '../entities/BaseClip';
import { ClipId } from '../value-objects/ClipId';

export interface IClipRepository {
  create(clip: BaseClip): Promise<void>;
  findById(id: ClipId): Promise<BaseClip | undefined>;
  save(clip: BaseClip): Promise<void>;
  delete(id: ClipId): Promise<void>;
}

export interface ILocalClipRepository extends IClipRepository {
  // 本地特定的方法可以在這裡添加
} 