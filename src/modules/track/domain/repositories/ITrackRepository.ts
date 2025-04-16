import { BaseTrack } from '../entities/BaseTrack';
import { TrackId } from '../value-objects/TrackId';

export interface ITrackRepository {
  save(track: BaseTrack): Promise<void>;
  findById(trackId: TrackId): Promise<BaseTrack | undefined>;
  delete(trackId: TrackId): Promise<void>;
  create(track: BaseTrack): Promise<void>;
} 