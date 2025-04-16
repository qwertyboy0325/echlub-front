import { injectable } from 'inversify';
import { ITrackRepository } from '../../domain/repositories/ITrackRepository';
import { TrackId } from '../../domain/value-objects/TrackId';
import { BaseTrack } from '../../domain/entities/BaseTrack';

@injectable()
export class TrackRepository implements ITrackRepository {
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