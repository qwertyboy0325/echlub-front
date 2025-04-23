import { TrackId } from '../value-objects/track/TrackId';
import { TrackRouting } from '../value-objects/track/TrackRouting';
import { TrackType } from '../value-objects/track/TrackType';
import { IPluginReference } from '../interfaces/IPluginReference';
import { BaseTrack } from '../entities/BaseTrack';

/**
 * 音軌工廠介面
 */
export interface ITrackFactory {
  /**
   * 建立特定類型的音軌
   */
  create(
    id: TrackId,
    name: string,
    routing?: TrackRouting,
    plugins?: IPluginReference[]
  ): BaseTrack;

  /**
   * 複製現有音軌
   */
  clone(
    sourceTrack: BaseTrack,
    newId: TrackId,
    newName?: string
  ): BaseTrack;
} 