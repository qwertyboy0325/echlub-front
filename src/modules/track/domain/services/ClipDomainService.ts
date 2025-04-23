import { injectable } from 'inversify';
import { AudioTrack } from '../entities/AudioTrack';
import { MidiTrack } from '../entities/MidiTrack';
import { AudioClip } from '../entities/clips/AudioClip';
import { MidiClip } from '../entities/clips/MidiClip';
import { BaseTrack } from '../entities/BaseTrack';
import { BaseClip } from '../entities/clips/BaseClip';
import { InvalidTrackTypeError } from '../errors/InvalidTrackTypeError';
import { ClipId } from '../value-objects/clips/ClipId';

@injectable()
export class ClipDomainService {
  /**
   * 驗證片段和軌道的類型相容性
   */
  validateClipTrackCompatibility(clip: BaseClip, track: BaseTrack): void {
    if (
      (clip instanceof AudioClip && !(track instanceof AudioTrack)) ||
      (clip instanceof MidiClip && !(track instanceof MidiTrack))
    ) {
      throw new InvalidTrackTypeError('Clip type does not match track type');
    }
  }

  /**
   * 獲取片段類型
   */
  getClipType(clip: BaseClip): 'audio' | 'midi' {
    return clip instanceof AudioClip ? 'audio' : 'midi';
  }

  /**
   * 從軌道移除片段
   */
  removeClipFromTrack(track: BaseTrack, clipId: ClipId): void {
    track.removeClip(clipId);
  }

  /**
   * 添加片段到軌道
   */
  addClipToTrack(track: BaseTrack, clipId: ClipId): void {
    track.addClip(clipId);
  }

  /**
   * 更新片段的開始時間
   */
  updateClipStartTime(clip: BaseClip, startTime: number): void {
    clip.setStartTime(startTime);
  }

  /**
   * 創建片段的克隆
   */
  createClipClone(clip: BaseClip): BaseClip {
    return clip.clone();
  }
} 