import { injectable } from 'inversify';
import { ILocalTrackRepository } from '../../domain/repositories/ITrackRepository';
import { BaseTrack } from '../../domain/entities/BaseTrack';
import { TrackId } from '../../domain/value-objects/track/TrackId';

@injectable()
export class LocalTrackRepository implements ILocalTrackRepository {
  private tracks: Map<string, BaseTrack> = new Map();

  async create(track: BaseTrack): Promise<void> {
    this.tracks.set(track.getTrackId().toString(), track);
  }

  async findById(id: TrackId): Promise<BaseTrack | undefined> {
    return this.tracks.get(id.toString());
  }

  async save(track: BaseTrack): Promise<void> {
    this.tracks.set(track.getTrackId().toString(), track);
  }

  async delete(id: TrackId): Promise<void> {
    this.tracks.delete(id.toString());
  }
} 