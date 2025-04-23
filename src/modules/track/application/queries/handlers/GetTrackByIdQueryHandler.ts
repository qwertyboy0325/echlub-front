import { injectable, inject } from 'inversify';
import { TrackTypes } from '../../../di/TrackTypes';
import { GetTrackByIdQuery } from '../GetTrackByIdQuery';
import type { ITrackRepository } from '../../../domain/repositories/ITrackRepository';
import { TrackOperationError } from '../../../domain/errors/TrackError';
import { BaseTrack } from '../../../domain/entities/BaseTrack';

@injectable()
export class GetTrackByIdQueryHandler {
  constructor(
    @inject(TrackTypes.TrackRepository) private repository: ITrackRepository
  ) {}

  /**
   * 處理獲取軌道的查詢
   * @param query 查詢物件
   * @returns 軌道實體
   * @throws {TrackOperationError} 當軌道不存在時
   */
  async handle(query: GetTrackByIdQuery): Promise<BaseTrack> {
    const track = await this.repository.findById(query.trackId);
    if (!track) {
      throw new TrackOperationError('Track not found');
    }
    return track;
  }
} 