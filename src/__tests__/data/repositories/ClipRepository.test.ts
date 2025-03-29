import { ClipRepositoryImpl } from '../../../data/repositories/ClipRepository';
import { ClipImpl } from '../../../data/models/Clip';

describe('ClipRepositoryImpl', () => {
  let repository: ClipRepositoryImpl;

  beforeEach(() => {
    repository = new ClipRepositoryImpl();
  });

  test('should create new clip', () => {
    const clip = repository.create({});
    expect(clip).toBeDefined();
    expect(clip.name).toBe('Untitled Clip');
    expect(clip.audioId).toBe('');
    expect(clip.startTime).toBe(0);
    expect(clip.duration).toBe(0);
    expect(clip.volume).toBe(1);
    expect(clip.pan).toBe(0);
    expect(clip.muted).toBe(false);
    expect(clip.soloed).toBe(false);
    expect(clip.effects).toEqual([]);
    expect(clip.automation).toEqual({});
  });

  test('should create clip with provided values', () => {
    const clip = repository.create({
      name: 'Test Clip',
      audioId: 'test-audio-id',
      startTime: 10,
      duration: 30,
      volume: 0.8,
      pan: 0.5,
      muted: true,
      soloed: false,
      effects: ['effect1', 'effect2'],
      automation: { volume: [0, 1, 0] }
    });

    expect(clip.name).toBe('Test Clip');
    expect(clip.audioId).toBe('test-audio-id');
    expect(clip.startTime).toBe(10);
    expect(clip.duration).toBe(30);
    expect(clip.volume).toBe(0.8);
    expect(clip.pan).toBe(0.5);
    expect(clip.muted).toBe(true);
    expect(clip.soloed).toBe(false);
    expect(clip.effects).toEqual(['effect1', 'effect2']);
    expect(clip.automation).toEqual({ volume: [0, 1, 0] });
  });

  test('should get clips by audio ID', () => {
    repository.create({ audioId: 'audio1' });
    repository.create({ audioId: 'audio1' });
    repository.create({ audioId: 'audio2' });

    const clips = repository.getByAudioId('audio1');
    expect(clips).toHaveLength(2);
    expect(clips.every(clip => clip.audioId === 'audio1')).toBe(true);
  });

  test('should return empty array for non-existent audio ID', () => {
    const clips = repository.getByAudioId('non-existent');
    expect(clips).toEqual([]);
  });

  test('should get clips by name', () => {
    repository.create({ name: 'Test Clip' });
    repository.create({ name: 'Test Clip' });
    repository.create({ name: 'Other Clip' });

    const clips = repository.getByName('Test Clip');
    expect(clips).toHaveLength(2);
    expect(clips.every(clip => clip.name === 'Test Clip')).toBe(true);
  });

  test('should return empty array for non-existent name', () => {
    const clips = repository.getByName('Non-existent');
    expect(clips).toEqual([]);
  });

  test('should get clips in time range', () => {
    repository.create({ startTime: 0, duration: 20 }); // 0-20
    repository.create({ startTime: 10, duration: 20 }); // 10-30
    repository.create({ startTime: 40, duration: 20 }); // 40-60

    const clips = repository.getInTimeRange(15, 35);
    expect(clips).toHaveLength(2);
    expect(clips.every(clip => {
      const clipEnd = clip.startTime + clip.duration;
      return clip.startTime <= 35 && clipEnd >= 15;
    })).toBe(true);
  });

  test('should return empty array for time range with no clips', () => {
    repository.create({ startTime: 0, duration: 10 });
    repository.create({ startTime: 20, duration: 10 });

    const clips = repository.getInTimeRange(15, 15);
    expect(clips).toEqual([]);
  });

  test('should get clips by track ID', () => {
    // This method will be implemented when we have track-clip relationship
    const clips = repository.getByTrackId('track1');
    expect(clips).toEqual([]);
  });

  test('should update clip position', () => {
    const clip = repository.create({}) as ClipImpl;
    const originalVersion = clip.version;
    clip.updatePosition(20);

    expect(clip.startTime).toBe(20);
    expect(clip.version).toBe(originalVersion + 1);
  });

  test('should update clip volume', () => {
    const clip = repository.create({}) as ClipImpl;
    const originalVersion = clip.version;
    clip.updateVolume(0.5);

    expect(clip.volume).toBe(0.5);
    expect(clip.version).toBe(originalVersion + 1);
  });

  test('should clamp volume between 0 and 1', () => {
    const clip = repository.create({}) as ClipImpl;
    clip.updateVolume(-1);
    expect(clip.volume).toBe(0);

    clip.updateVolume(2);
    expect(clip.volume).toBe(1);
  });

  test('should update clip pan', () => {
    const clip = repository.create({}) as ClipImpl;
    const originalVersion = clip.version;
    clip.updatePan(0.5);

    expect(clip.pan).toBe(0.5);
    expect(clip.version).toBe(originalVersion + 1);
  });

  test('should clamp pan between -1 and 1', () => {
    const clip = repository.create({}) as ClipImpl;
    clip.updatePan(-2);
    expect(clip.pan).toBe(-1);

    clip.updatePan(2);
    expect(clip.pan).toBe(1);
  });

  test('should toggle clip mute', () => {
    const clip = repository.create({}) as ClipImpl;
    const originalVersion = clip.version;
    clip.toggleMute();

    expect(clip.muted).toBe(true);
    expect(clip.version).toBe(originalVersion + 1);

    clip.toggleMute();
    expect(clip.muted).toBe(false);
    expect(clip.version).toBe(originalVersion + 2);
  });

  test('should toggle clip solo', () => {
    const clip = repository.create({}) as ClipImpl;
    const originalVersion = clip.version;
    clip.toggleSolo();

    expect(clip.soloed).toBe(true);
    expect(clip.version).toBe(originalVersion + 1);

    clip.toggleSolo();
    expect(clip.soloed).toBe(false);
    expect(clip.version).toBe(originalVersion + 2);
  });

  test('should add effect to clip', () => {
    const clip = repository.create({}) as ClipImpl;
    const originalVersion = clip.version;
    clip.addEffect('effect1');

    expect(clip.effects).toEqual(['effect1']);
    expect(clip.version).toBe(originalVersion + 1);
  });

  test('should not add duplicate effect', () => {
    const clip = repository.create({}) as ClipImpl;
    clip.addEffect('effect1');
    const originalVersion = clip.version;
    clip.addEffect('effect1');

    expect(clip.effects).toEqual(['effect1']);
    expect(clip.version).toBe(originalVersion);
  });

  test('should remove effect from clip', () => {
    const clip = repository.create({}) as ClipImpl;
    clip.addEffect('effect1');
    const originalVersion = clip.version;
    clip.removeEffect('effect1');

    expect(clip.effects).toEqual([]);
    expect(clip.version).toBe(originalVersion + 1);
  });

  test('should update automation data', () => {
    const clip = repository.create({}) as ClipImpl;
    const originalVersion = clip.version;
    clip.updateAutomation('volume', [0, 1, 0]);

    expect(clip.automation).toEqual({ volume: [0, 1, 0] });
    expect(clip.version).toBe(originalVersion + 1);
  });
}); 