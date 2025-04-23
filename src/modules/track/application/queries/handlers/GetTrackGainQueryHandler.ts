import { injectable, inject } from 'inversify';
import { TrackTypes } from '../../../di/TrackTypes';
import { GetTrackGainQuery } from '../GetTrackGainQuery';
import type { ITrackRepository } from '../../../domain/repositories/ITrackRepository';
import { TrackOperationError } from '../../../domain/errors/TrackError';

@injectable()
export class GetTrackGainQueryHandler {
  constructor(
    @inject(TrackTypes.TrackRepository) private repository: ITrackRepository
  ) {}

  /**
   * 處理獲取軌道音量的查詢
   * @param query 查詢物件
   * @returns 軌道音量值
   * @throws {TrackOperationError} 當軌道不存在時
   */
  async handle(query: GetTrackGainQuery): Promise<number> {
    const track = await this.repository.findById(query.trackId);
    if (!track) {
      throw new TrackOperationError('Track not found');
    }
    return track.getVolume();
  }
} 