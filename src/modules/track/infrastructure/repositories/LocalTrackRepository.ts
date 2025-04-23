import { injectable } from 'inversify';
import { ITrackRepository } from '../../domain/repositories/ITrackRepository';
import { BaseTrack } from '../../domain/entities/BaseTrack';
import { TrackId } from '../../domain/value-objects/track/TrackId';

@injectable()
export class LocalTrackRepository implements ITrackRepository {
  private tracks: Map<string, BaseTrack> = new Map();

  async create(track: BaseTrack): Promise<void> {
    await this.save(track);
  }

  async findById(id: TrackId): Promise<BaseTrack | null> {
    const track = this.tracks.get(id.toString());
    return track || null;
  }

  async save(track: BaseTrack): Promise<void> {
    this.tracks.set(track.getId(), track);
  }

  async delete(id: TrackId): Promise<void> {
    this.tracks.delete(id.toString());
  }

  async findAll(): Promise<BaseTrack[]> {
    return Array.from(this.tracks.values());
  }
} 