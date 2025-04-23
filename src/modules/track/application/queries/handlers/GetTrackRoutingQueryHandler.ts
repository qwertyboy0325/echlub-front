import { injectable, inject } from 'inversify';
import { TrackTypes } from '../../../di/TrackTypes';
import { GetTrackRoutingQuery } from '../GetTrackRoutingQuery';
import type { ITrackRepository } from '../../../domain/repositories/ITrackRepository';
import { TrackOperationError } from '../../../domain/errors/TrackError';
import { TrackRouting } from '../../../domain/value-objects/track/TrackRouting';

@injectable()
export class GetTrackRoutingQueryHandler {
  constructor(
    @inject(TrackTypes.TrackRepository) private repository: ITrackRepository
  ) {}

  /**
   * 處理獲取軌道路由的查詢
   * @param query 查詢物件
   * @returns 軌道路由設置
   * @throws {TrackOperationError} 當軌道不存在時
   */
  async handle(query: GetTrackRoutingQuery): Promise<TrackRouting> {
    const track = await this.repository.findById(query.trackId);
    if (!track) {
      throw new TrackOperationError('Track not found');
    }
    return track.getRouting();
  }
} 