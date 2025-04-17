import { BaseTrack } from '../entities/BaseTrack';
import { TrackId } from '../value-objects/TrackId';

export interface ITrackRepository {
  create(track: BaseTrack): Promise<void>;
  findById(id: TrackId): Promise<BaseTrack | undefined>;
  save(track: BaseTrack): Promise<void>;
  delete(id: TrackId): Promise<void>;
}

export interface ILocalTrackRepository extends ITrackRepository {
  sync(): Promise<void>;
}

export interface IWebSocketTrackRepository extends ITrackRepository {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

export interface IWebRTCTrackRepository extends ITrackRepository {
  establishConnection(): Promise<void>;
  closeConnection(): Promise<void>;
} 