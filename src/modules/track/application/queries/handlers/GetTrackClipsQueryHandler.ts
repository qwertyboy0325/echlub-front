import { injectable, inject } from 'inversify';
import { TrackTypes } from '../../../di/TrackTypes';
import { GetTrackClipsQuery } from '../GetTrackClipsQuery';
import type { ITrackRepository } from '../../../domain/repositories/ITrackRepository';
import type { IClipRepository } from '../../../domain/repositories/IClipRepository';
import { BaseClip } from '../../../domain/entities/clips/BaseClip';
import { ClipId } from '../../../domain/value-objects/clips/ClipId';

@injectable()
export class GetTrackClipsQueryHandler {
  constructor(
    @inject(TrackTypes.TrackRepository) private trackRepository: ITrackRepository,
    @inject(TrackTypes.ClipRepository) private clipRepository: IClipRepository
  ) {}

  async handle(query: GetTrackClipsQuery): Promise<BaseClip[]> {
    const track = await this.trackRepository.findById(query.trackId);
    if (!track) {
      return [];
    }

    const clipIds: ClipId[] = track.getClips();
    const clips = await Promise.all(
      clipIds.map((clipId: ClipId) => this.clipRepository.findById(clipId))
    );

    // 過濾掉不存在的片段
    const existingClips = clips.filter((clip: BaseClip | null): clip is BaseClip => clip !== null);

    // 如果指定了時間範圍，進行過濾
    if (query.startTime !== undefined && query.endTime !== undefined) {
      return existingClips.filter((clip: BaseClip) => 
        clip.getStartTime() >= query.startTime! &&
        clip.getStartTime() + clip.getDuration() <= query.endTime!
      );
    }

    return existingClips;
  }
} 