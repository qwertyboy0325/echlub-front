import { injectable } from 'inversify';
import { ILocalTrackRepository } from '../../domain/repositories/ITrackRepository';
import { BaseTrack } from '../../domain/entities/BaseTrack';
import { TrackId } from '../../domain/value-objects/TrackId';

@injectable()
export class LocalTrackRepository implements ILocalTrackRepository {
  private tracks: Map<string, BaseTrack> = new Map();

  async create(track: BaseTrack): Promise<void> {
    this.tracks.set(track.getTrackId().toString(), track);
    await this.persistToLocalStorage();
  }

  async findById(id: TrackId): Promise<BaseTrack | undefined> {
    return this.tracks.get(id.toString());
  }

  async save(track: BaseTrack): Promise<void> {
    this.tracks.set(track.getTrackId().toString(), track);
    await this.persistToLocalStorage();
  }

  async delete(id: TrackId): Promise<void> {
    this.tracks.delete(id.toString());
    await this.persistToLocalStorage();
  }

  async sync(): Promise<void> {
    const storedData = localStorage.getItem('tracks');
    if (storedData) {
      const tracks = JSON.parse(storedData);
      tracks.forEach((trackData: any) => {
        // 將 JSON 數據轉換回 Track 實體
        const track = this.deserializeTrack(trackData);
        if (track) {
          this.tracks.set(track.getTrackId().toString(), track);
        }
      });
    }
  }

  private async persistToLocalStorage(): Promise<void> {
    const data = Array.from(this.tracks.values()).map(track => track.toJSON());
    localStorage.setItem('tracks', JSON.stringify(data));
  }

  private deserializeTrack(data: any): BaseTrack | null {
    // 需要實現反序列化邏輯
    // 這裡需要根據實際的 Track 類型來實現
    return null;
  }
} 