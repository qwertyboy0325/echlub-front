import { Container } from 'inversify';
import { ClipRepositoryImpl } from '../ClipRepositoryImpl';
import type { Storage } from '../../../infrastructure/storage/Storage';
import type { Clip } from '../../../domain/models/Clip';
import type { ClipDTO } from '../../models/ClipDTO';
import { ClipImpl } from '../../../domain/models/Clip';

// 測試用的存儲實現
class MockStorage implements Storage {
  private data: Record<string, any[]> = {};

  async get<T>(key: string): Promise<T[]> {
    return this.data[key] || [];
  }

  async set<T>(key: string, value: T[]): Promise<void> {
    this.data[key] = value;
  }

  async remove(key: string): Promise<void> {
    delete this.data[key];
  }

  async clear(): Promise<void> {
    this.data = {};
  }
}

describe('ClipRepositoryImpl', () => {
  let container: Container;
  let storage: Storage;
  let repository: ClipRepositoryImpl;

  beforeEach(() => {
    container = new Container();
    storage = new MockStorage();
    container.bind<Storage>('Storage').toConstantValue(storage);
    repository = new ClipRepositoryImpl(storage, 'clip_storage');
  });

  describe('findByTrackId', () => {
    it('should return empty array when no clips exist', async () => {
      const result = await repository.findByTrackId('track-1');
      expect(result).toEqual([]);
    });

    it('should return clips for given track id', async () => {
      const clip1 = new ClipImpl('audio-1', 0, 10, 0);
      clip1.trackId = 'track-1';
      const clip2 = new ClipImpl('audio-2', 0, 10, 0);
      clip2.trackId = 'track-2';

      await repository.save(clip1);
      await repository.save(clip2);

      const result = await repository.findByTrackId('track-1');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(clip1.id);
    });
  });

  describe('findByAudioUrl', () => {
    it('should return empty array when no clips exist', async () => {
      const result = await repository.findByAudioUrl('audio-1');
      expect(result).toEqual([]);
    });

    it('should return clips for given audio url', async () => {
      const clip1 = new ClipImpl('audio-1', 0, 10, 0, 'test-clip-1');
      clip1.trackId = 'track-1';
      const clip2 = new ClipImpl('audio-2', 0, 10, 0, 'test-clip-2');
      clip2.trackId = 'track-2';

      await repository.save(clip1);
      await repository.save(clip2);

      const result = await repository.findByAudioUrl('audio-1');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(clip1.id);
    });
  });

  describe('CRUD operations', () => {
    it('should save and retrieve a clip', async () => {
      const clip = new ClipImpl('audio-1', 0, 10, 0);
      await repository.save(clip);
      const retrieved = await repository.findById(clip.id);
      expect(retrieved?.name).toBe(clip.name);
      expect(retrieved?.audioUrl).toBe(clip.audioUrl);
      expect(retrieved?.startTime).toBe(clip.startTime);
      expect(retrieved?.duration).toBe(clip.duration);
      expect(retrieved?.position).toBe(clip.position);
      expect(retrieved?.volume).toBe(clip.volume);
      expect(retrieved?.pan).toBe(clip.pan);
      expect(retrieved?.muted).toBe(clip.muted);
      expect(retrieved?.soloed).toBe(clip.soloed);
      expect(retrieved?.effects).toEqual(clip.effects);
      expect(retrieved?.automation).toEqual(clip.automation);
      expect(retrieved?.trackId).toBe(clip.trackId);
    });

    it('should update a clip', async () => {
      const clip = new ClipImpl('audio-1', 0, 10, 0);
      await repository.save(clip);
      clip.updateStartTime(5);
      await repository.save(clip);
      const updated = await repository.findById(clip.id);
      expect(updated?.startTime).toBe(5);
    });

    it('should delete a clip', async () => {
      const clip = new ClipImpl('audio-1', 0, 10, 0);
      await repository.save(clip);
      await repository.delete(clip.id);
      const deleted = await repository.findById(clip.id);
      expect(deleted).toBeNull();
    });

    it('should check if clip exists', async () => {
      const clip = new ClipImpl('audio-1', 0, 10, 0);
      await repository.save(clip);
      const exists = await repository.exists(clip.id);
      expect(exists).toBe(true);
    });

    it('should count clips', async () => {
      const clip1 = new ClipImpl('audio-1', 0, 10, 0);
      const clip2 = new ClipImpl('audio-2', 0, 10, 0);
      await repository.save(clip1);
      await repository.save(clip2);
      const count = await repository.count();
      expect(count).toBe(2);
    });
  });
}); 