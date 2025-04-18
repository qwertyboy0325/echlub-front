import { BaseTrack } from '../entities/BaseTrack';
import { TrackId } from '../value-objects/TrackId';

export interface ITrackRepository {
  create(track: BaseTrack): Promise<void>;
  findById(id: TrackId): Promise<BaseTrack | undefined>;
  save(track: BaseTrack): Promise<void>;
  delete(id: TrackId): Promise<void>;
}

export interface ILocalTrackRepository extends ITrackRepository {}
export interface IWebSocketTrackRepository extends ITrackRepository {}
export interface IWebRTCTrackRepository extends ITrackRepository {} 