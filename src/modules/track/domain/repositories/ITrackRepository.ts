import { BaseTrack } from '../entities/BaseTrack';
import { TrackId } from '../value-objects/track/TrackId';

export interface ITrackRepository {
  findById(id: TrackId): Promise<BaseTrack | null>;
  save(track: BaseTrack): Promise<void>;
  delete(id: TrackId): Promise<void>;
}

export interface ILocalTrackRepository extends ITrackRepository {}
export interface IWebSocketTrackRepository extends ITrackRepository {}
export interface IWebRTCTrackRepository extends ITrackRepository {} 