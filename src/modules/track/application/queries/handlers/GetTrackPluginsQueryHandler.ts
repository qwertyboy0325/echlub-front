import { injectable, inject } from 'inversify';
import { TrackTypes } from '../../../di/TrackTypes';
import { GetTrackPluginsQuery } from '../GetTrackPluginsQuery';
import type { ITrackRepository } from '../../../domain/repositories/ITrackRepository';
import { TrackOperationError } from '../../../domain/errors/TrackError';
import { IPluginReference } from '../../../domain/interfaces/IPluginReference';

@injectable()
export class GetTrackPluginsQueryHandler {
  constructor(
    @inject(TrackTypes.TrackRepository) private repository: ITrackRepository
  ) {}

  /**
   * 處理獲取軌道插件的查詢
   * @param query 查詢物件
   * @returns 插件引用列表
   * @throws {TrackOperationError} 當軌道不存在時
   */
  async handle(query: GetTrackPluginsQuery): Promise<IPluginReference[]> {
    const track = await this.repository.findById(query.trackId);
    if (!track) {
      throw new TrackOperationError('Track not found');
    }
    return track.getPlugins();
  }
} 