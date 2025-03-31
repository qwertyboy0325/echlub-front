import { ClipRepositoryImpl } from '../../../data/repositories/ClipRepositoryImpl';
import { ClipImpl } from '../../../domain/models/Clip';
import { Storage } from '../../../infrastructure/storage/Storage';

describe('ClipRepositoryImpl', () => {
  let repository: ClipRepositoryImpl;
  let mockStorage: Storage;

  beforeEach(() => {
    mockStorage = {
      get: jest.fn().mockResolvedValue({}),
      set: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
      clear: jest.fn().mockResolvedValue(undefined)
    };
    repository = new ClipRepositoryImpl(mockStorage);
  });

  test('should save clip', async () => {
    const clip = new ClipImpl('test-url', 0, 10, 0, 'test-clip');
    clip.trackId = 'track-1';
    const savedClip = await repository.save(clip);
    expect(savedClip).toBeDefined();
    expect(savedClip.id).toBe(clip.id);
    expect(mockStorage.set).toHaveBeenCalledWith('clip_storage', expect.any(Object));
  });

  test('should find clip by ID', async () => {
    const clip = new ClipImpl('test-url', 0, 10, 0, 'test-clip');
    clip.trackId = 'track-1';
    const dto = {
      id: clip.id,
      name: clip.name,
      audioUrl: clip.audioUrl,
      trackId: clip.trackId,
      startTime: clip.startTime,
      duration: clip.duration,
      position: clip.position,
      volume: clip.volume,
      pan: clip.pan,
      muted: clip.muted,
      soloed: clip.soloed,
      effects: clip.effects,
      automation: clip.automation,
      version: clip.version,
      createdAt: clip.createdAt.toISOString(),
      updatedAt: clip.updatedAt.toISOString()
    };
    (mockStorage.get as jest.Mock).mockResolvedValue({ [clip.id]: dto });

    const foundClip = await repository.findById(clip.id);
    expect(foundClip).toBeDefined();
    expect(foundClip?.id).toBe(clip.id);
  });

  test('should find all clips', async () => {
    const clip1 = new ClipImpl('test-url-1', 0, 10, 0, 'test-clip-1');
    clip1.trackId = 'track-1';
    const clip2 = new ClipImpl('test-url-2', 20, 15, 20, 'test-clip-2');
    clip2.trackId = 'track-2';
    const dto1 = {
      id: clip1.id,
      name: clip1.name,
      audioUrl: clip1.audioUrl,
      trackId: clip1.trackId,
      startTime: clip1.startTime,
      duration: clip1.duration,
      position: clip1.position,
      volume: clip1.volume,
      pan: clip1.pan,
      muted: clip1.muted,
      soloed: clip1.soloed,
      effects: clip1.effects,
      automation: clip1.automation,
      version: clip1.version,
      createdAt: clip1.createdAt.toISOString(),
      updatedAt: clip1.updatedAt.toISOString()
    };
    const dto2 = {
      id: clip2.id,
      name: clip2.name,
      audioUrl: clip2.audioUrl,
      trackId: clip2.trackId,
      startTime: clip2.startTime,
      duration: clip2.duration,
      position: clip2.position,
      volume: clip2.volume,
      pan: clip2.pan,
      muted: clip2.muted,
      soloed: clip2.soloed,
      effects: clip2.effects,
      automation: clip2.automation,
      version: clip2.version,
      createdAt: clip2.createdAt.toISOString(),
      updatedAt: clip2.updatedAt.toISOString()
    };
    (mockStorage.get as jest.Mock).mockResolvedValue({
      [clip1.id]: dto1,
      [clip2.id]: dto2
    });

    const foundClips = await repository.findAll();
    expect(foundClips).toHaveLength(2);
    expect(foundClips[0].id).toBe(clip1.id);
    expect(foundClips[1].id).toBe(clip2.id);
  });

  test('should find clips by track ID', async () => {
    const clip = new ClipImpl('test-url', 0, 10, 0, 'test-clip');
    clip.trackId = 'track-1';
    const dto = {
      id: clip.id,
      name: clip.name,
      audioUrl: clip.audioUrl,
      trackId: clip.trackId,
      startTime: clip.startTime,
      duration: clip.duration,
      position: clip.position,
      volume: clip.volume,
      pan: clip.pan,
      muted: clip.muted,
      soloed: clip.soloed,
      effects: clip.effects,
      automation: clip.automation,
      version: clip.version,
      createdAt: clip.createdAt.toISOString(),
      updatedAt: clip.updatedAt.toISOString()
    };
    (mockStorage.get as jest.Mock).mockResolvedValue({ [clip.id]: dto });

    const foundClips = await repository.findByTrackId('track-1');
    expect(foundClips).toHaveLength(1);
    expect(foundClips[0].id).toBe(clip.id);
  });

  test('should find clips by audio URL', async () => {
    const clip = new ClipImpl('test-url', 0, 10, 0, 'test-clip');
    clip.trackId = 'track-1';
    const dto = {
      id: clip.id,
      name: clip.name,
      audioUrl: clip.audioUrl,
      trackId: clip.trackId,
      startTime: clip.startTime,
      duration: clip.duration,
      position: clip.position,
      volume: clip.volume,
      pan: clip.pan,
      muted: clip.muted,
      soloed: clip.soloed,
      effects: clip.effects,
      automation: clip.automation,
      version: clip.version,
      createdAt: clip.createdAt.toISOString(),
      updatedAt: clip.updatedAt.toISOString()
    };
    (mockStorage.get as jest.Mock).mockResolvedValue({ [clip.id]: dto });

    const foundClips = await repository.findByAudioUrl('test-url');
    expect(foundClips).toHaveLength(1);
    expect(foundClips[0].id).toBe(clip.id);
  });

  test('should update clip position', async () => {
    const clip = new ClipImpl('test-url', 0, 10, 0, 'test-clip');
    clip.trackId = 'track-1';
    clip.updatePosition(20);
    const savedClip = await repository.save(clip);
    expect(savedClip.position).toBe(20);
  });

  test('should update clip volume', async () => {
    const clip = new ClipImpl('test-url', 0, 10, 0, 'test-clip');
    clip.trackId = 'track-1';
    clip.updateVolume(0.5);
    const savedClip = await repository.save(clip);
    expect(savedClip.volume).toBe(0.5);
  });

  test('should delete clip', async () => {
    const clip = new ClipImpl('test-url', 0, 10, 0, 'test-clip');
    clip.trackId = 'track-1';
    const dto = {
      id: clip.id,
      name: clip.name,
      audioUrl: clip.audioUrl,
      trackId: clip.trackId,
      startTime: clip.startTime,
      duration: clip.duration,
      position: clip.position,
      volume: clip.volume,
      pan: clip.pan,
      muted: clip.muted,
      soloed: clip.soloed,
      effects: clip.effects,
      automation: clip.automation,
      version: clip.version,
      createdAt: clip.createdAt.toISOString(),
      updatedAt: clip.updatedAt.toISOString()
    };
    (mockStorage.get as jest.Mock).mockResolvedValue({ [clip.id]: dto });

    await repository.delete(clip.id);
    expect(mockStorage.set).toHaveBeenCalledWith('clip_storage', {});
  });
}); 