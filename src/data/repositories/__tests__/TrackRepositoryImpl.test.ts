import { Container } from 'inversify';
import { TrackRepositoryImpl } from '../TrackRepositoryImpl';
import type { Storage } from '../../../infrastructure/storage/Storage';
import type { Track } from '../../../domain/models/Track';
import type { TrackDTO } from '../../models/TrackDTO';
import { TrackImpl } from '../../../domain/models/Track';
import { ClipImpl } from '../../../domain/models/Clip';

// 測試用的存儲實現
class MockStorage implements Storage {
  private data: Record<string, Record<string, any>> = {};

  async get<T>(key: string): Promise<T | null> {
    return this.data[key] || null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.data[key] = { ...value };
  }

  async remove(key: string): Promise<void> {
    delete this.data[key];
  }

  async clear(): Promise<void> {
    this.data = {};
  }
}

describe('TrackRepositoryImpl', () => {
  let container: Container;
  let storage: Storage;
  let repository: TrackRepositoryImpl;

  beforeEach(() => {
    container = new Container();
    storage = new MockStorage();
    container.bind<Storage>('Storage').toConstantValue(storage);
    repository = new TrackRepositoryImpl(storage);
  });

  describe('findByProjectId', () => {
    it('should return empty array when no tracks exist', async () => {
      const result = await repository.findByProjectId('project-1');
      expect(result).toEqual([]);
    });

    it('should return tracks for given project id', async () => {
      const track1 = new TrackImpl('Track 1');
      track1.projectId = 'project-1';
      const track2 = new TrackImpl('Track 2');
      track2.projectId = 'project-2';

      await repository.save(track1);
      await repository.save(track2);

      const result = await repository.findByProjectId('project-1');
      expect(result).toHaveLength(1);
      expect(result[0].projectId).toBe('project-1');
    });
  });

  describe('findByClipId', () => {
    it('should return empty array when no tracks exist', async () => {
      const result = await repository.findByClipId('clip-1');
      expect(result).toEqual([]);
    });

    it('should return tracks containing the given clip', async () => {
      const track1 = new TrackImpl('Track 1');
      track1.projectId = 'project-1';
      const track2 = new TrackImpl('Track 2');
      track2.projectId = 'project-2';
      const clip1 = new ClipImpl('audio-1', 0, 10, 0, 'test-clip');
      track1.addClip(clip1);

      await repository.save(track1);
      await repository.save(track2);

      const result = await repository.findByClipId(clip1.id);
      expect(result).toHaveLength(1);
      expect(result[0].clips).toContainEqual(clip1);
    });
  });

  describe('CRUD operations', () => {
    it('should save and retrieve a track', async () => {
      const track = new TrackImpl('Test Track');
      track.projectId = 'project-1';
      const trackDTO = { ...track, id: track.id };

      await repository.save(track);
      const retrieved = await repository.findById(track.id);
      expect(retrieved).toEqual(track);
    });

    it('should update a track', async () => {
      const track = new TrackImpl('Test Track');
      track.projectId = 'project-1';
      const trackDTO = { ...track, id: track.id };

      await repository.save(track);
      track.name = 'Updated Track';
      await repository.save(track);
      const updated = await repository.findById(track.id);
      expect(updated?.name).toBe('Updated Track');
    });

    it('should delete a track', async () => {
      const track = new TrackImpl('Test Track');
      track.projectId = 'project-1';
      const trackDTO = { ...track, id: track.id };

      await repository.save(track);
      await repository.delete(track.id);
      const deleted = await repository.findById(track.id);
      expect(deleted).toBeNull();
    });

    it('should check if track exists', async () => {
      const track = new TrackImpl('Test Track');
      track.projectId = 'project-1';
      await repository.save(track);
      const exists = await repository.exists(track.id);
      expect(exists).toBe(true);
    });

    it('should count tracks', async () => {
      const track1 = new TrackImpl('Track 1');
      track1.projectId = 'project-1';
      const track2 = new TrackImpl('Track 2');
      track2.projectId = 'project-2';
      await repository.save(track1);
      await repository.save(track2);
      const count = await repository.count();
      expect(count).toBe(2);
    });
  });
}); 