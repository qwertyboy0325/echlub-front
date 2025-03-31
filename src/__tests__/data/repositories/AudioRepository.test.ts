import { AudioRepositoryImpl } from '../../../data/repositories/AudioRepositoryImpl';
import { AudioImpl } from '../../../data/models/Audio';
import { Storage } from '../../../infrastructure/storage/Storage';

describe('AudioRepositoryImpl', () => {
  let repository: AudioRepositoryImpl;
  let mockStorage: Storage;

  beforeEach(() => {
    mockStorage = {
      get: jest.fn().mockResolvedValue({}),
      set: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
      clear: jest.fn().mockResolvedValue(undefined)
    };
    repository = new AudioRepositoryImpl(mockStorage);
  });

  test('should save audio file', async () => {
    const audio = new AudioImpl('Test Audio', 'test-url', 10, 44100, 2, 'wav');
    const savedAudio = await repository.save(audio);
    expect(savedAudio).toBeDefined();
    expect(savedAudio.id).toBe(audio.id);
    expect(mockStorage.set).toHaveBeenCalledWith('audio_storage', expect.any(Object));
  });

  test('should find audio by ID', async () => {
    const audio = new AudioImpl('Test Audio', 'test-url', 10, 44100, 2, 'wav');
    const dto = {
      id: audio.id,
      name: audio.name,
      url: audio.url,
      duration: audio.duration,
      sampleRate: audio.sampleRate,
      channels: audio.channels,
      format: audio.format,
      metadata: audio.metadata,
      version: audio.version,
      createdAt: audio.createdAt.toISOString(),
      updatedAt: audio.updatedAt.toISOString()
    };
    (mockStorage.get as jest.Mock).mockResolvedValue({ [audio.id]: dto });

    const found = await repository.findById(audio.id);
    expect(found).toBeDefined();
    expect(found?.id).toBe(audio.id);
  });

  test('should find all audio files', async () => {
    const audio1 = new AudioImpl('Test Audio 1', 'test-url-1', 10, 44100, 2, 'wav');
    const audio2 = new AudioImpl('Test Audio 2', 'test-url-2', 20, 44100, 2, 'wav');
    const dto1 = {
      id: audio1.id,
      name: audio1.name,
      url: audio1.url,
      duration: audio1.duration,
      sampleRate: audio1.sampleRate,
      channels: audio1.channels,
      format: audio1.format,
      metadata: audio1.metadata,
      version: audio1.version,
      createdAt: audio1.createdAt.toISOString(),
      updatedAt: audio1.updatedAt.toISOString()
    };
    const dto2 = {
      id: audio2.id,
      name: audio2.name,
      url: audio2.url,
      duration: audio2.duration,
      sampleRate: audio2.sampleRate,
      channels: audio2.channels,
      format: audio2.format,
      metadata: audio2.metadata,
      version: audio2.version,
      createdAt: audio2.createdAt.toISOString(),
      updatedAt: audio2.updatedAt.toISOString()
    };
    (mockStorage.get as jest.Mock).mockResolvedValue({
      [audio1.id]: dto1,
      [audio2.id]: dto2
    });

    const found = await repository.findAll();
    expect(found).toHaveLength(2);
    expect(found[0].id).toBe(audio1.id);
    expect(found[1].id).toBe(audio2.id);
  });

  test('should find audio by URL', async () => {
    const audio = new AudioImpl('Test Audio', 'test-url', 10, 44100, 2, 'wav');
    const dto = {
      id: audio.id,
      name: audio.name,
      url: audio.url,
      duration: audio.duration,
      sampleRate: audio.sampleRate,
      channels: audio.channels,
      format: audio.format,
      metadata: audio.metadata,
      version: audio.version,
      createdAt: audio.createdAt.toISOString(),
      updatedAt: audio.updatedAt.toISOString()
    };
    (mockStorage.get as jest.Mock).mockResolvedValue({ [audio.id]: dto });

    const found = await repository.findByUrl('test-url');
    expect(found).toBeDefined();
    expect(found?.id).toBe(audio.id);
  });

  test('should find audio by format', async () => {
    const audio = new AudioImpl('Test Audio', 'test-url', 10, 44100, 2, 'wav');
    const dto = {
      id: audio.id,
      name: audio.name,
      url: audio.url,
      duration: audio.duration,
      sampleRate: audio.sampleRate,
      channels: audio.channels,
      format: audio.format,
      metadata: audio.metadata,
      version: audio.version,
      createdAt: audio.createdAt.toISOString(),
      updatedAt: audio.updatedAt.toISOString()
    };
    (mockStorage.get as jest.Mock).mockResolvedValue({ [audio.id]: dto });

    const found = await repository.findByFormat('wav');
    expect(found).toHaveLength(1);
    expect(found[0].id).toBe(audio.id);
  });

  test('should delete audio', async () => {
    const audio = new AudioImpl('Test Audio', 'test-url', 10, 44100, 2, 'wav');
    const dto = {
      id: audio.id,
      name: audio.name,
      url: audio.url,
      duration: audio.duration,
      sampleRate: audio.sampleRate,
      channels: audio.channels,
      format: audio.format,
      metadata: audio.metadata,
      version: audio.version,
      createdAt: audio.createdAt.toISOString(),
      updatedAt: audio.updatedAt.toISOString()
    };
    (mockStorage.get as jest.Mock).mockResolvedValue({ [audio.id]: dto });

    await repository.delete(audio.id);
    expect(mockStorage.set).toHaveBeenCalledWith('audio_storage', {});
  });
}); 