import { Container } from 'inversify';
import { AudioRepositoryImpl } from '../AudioRepositoryImpl';
import type { Storage } from '../../../infrastructure/storage/Storage';
import type { Audio } from '../../../domain/models/Audio';
import type { AudioDTO } from '../../models/AudioDTO';
import { AudioImpl } from '../../../domain/models/Audio';

// 測試用的存儲實現
class MockStorage implements Storage {
  private data: Record<string, Record<string, any>> = {};

  async get<T>(key: string): Promise<T> {
    return this.data[key] || {};
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.data[key] = value;
  }

  async remove(key: string): Promise<void> {
    delete this.data[key];
  }

  async clear(): Promise<void> {
    this.data = {};
  }
}

describe('AudioRepositoryImpl', () => {
  let container: Container;
  let storage: Storage;
  let repository: AudioRepositoryImpl;

  beforeEach(() => {
    container = new Container();
    storage = new MockStorage();
    container.bind<Storage>('Storage').toConstantValue(storage);
    repository = new AudioRepositoryImpl(storage);
  });

  describe('findByUrl', () => {
    it('should return null when no audio exists', async () => {
      const result = await repository.findByUrl('non-existent');
      expect(result).toBeNull();
    });

    it('should return audio for given url', async () => {
      const audio1 = new AudioImpl('Test Audio 1', 'url-1', 10, 44100, 2, 'wav');
      const audio2 = new AudioImpl('Test Audio 2', 'url-2', 20, 44100, 2, 'wav');

      await repository.save(audio1);
      await repository.save(audio2);

      const result = await repository.findByUrl('url-1');
      expect(result?.id).toBe(audio1.id);
    });
  });

  describe('findByFormat', () => {
    it('should return empty array when no audio exists', async () => {
      const result = await repository.findByFormat('wav');
      expect(result).toEqual([]);
    });

    it('should return audio files for given format', async () => {
      const audio1 = new AudioImpl('Test Audio 1', 'url-1', 10, 44100, 2, 'wav');
      const audio2 = new AudioImpl('Test Audio 2', 'url-2', 20, 44100, 2, 'mp3');

      await repository.save(audio1);
      await repository.save(audio2);

      const result = await repository.findByFormat('wav');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(audio1.id);
    });
  });

  describe('CRUD operations', () => {
    it('should save and retrieve an audio file', async () => {
      const audio = new AudioImpl('Test Audio', 'test-url', 10, 44100, 2, 'wav');

      await repository.save(audio);
      const retrieved = await repository.findById(audio.id);
      expect(retrieved).toEqual(audio);
    });

    it('should update an audio file', async () => {
      const audio = new AudioImpl('Test Audio', 'test-url', 10, 44100, 2, 'wav');

      await repository.save(audio);
      audio.name = 'Updated Audio';
      await repository.save(audio);
      const updated = await repository.findById(audio.id);
      expect(updated?.name).toBe('Updated Audio');
    });

    it('should delete an audio file', async () => {
      const audio = new AudioImpl('Test Audio', 'test-url', 10, 44100, 2, 'wav');

      await repository.save(audio);
      await repository.delete(audio.id);
      const deleted = await repository.findById(audio.id);
      expect(deleted).toBeNull();
    });

    it('should check if audio exists', async () => {
      const audio = new AudioImpl('Test Audio', 'test-url', 10, 44100, 2, 'wav');
      await repository.save(audio);
      const exists = await repository.exists(audio.id);
      expect(exists).toBe(true);
    });

    it('should count audio files', async () => {
      const audio1 = new AudioImpl('Audio 1', 'url-1', 10, 44100, 2, 'wav');
      const audio2 = new AudioImpl('Audio 2', 'url-2', 20, 44100, 2, 'wav');
      await repository.save(audio1);
      await repository.save(audio2);
      const count = await repository.count();
      expect(count).toBe(2);
    });
  });
}); 