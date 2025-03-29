import { ClipImpl } from '../../../data/models/Clip';

describe('ClipImpl', () => {
  let clip: ClipImpl;

  beforeEach(() => {
    clip = new ClipImpl({});
  });

  test('should create with default values', () => {
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

  test('should create with provided values', () => {
    const clip = new ClipImpl({
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

  test('should update position', () => {
    const originalVersion = clip.version;
    clip.updatePosition(20);

    expect(clip.startTime).toBe(20);
    expect(clip.version).toBe(originalVersion + 1);
  });

  test('should update volume', () => {
    const originalVersion = clip.version;
    clip.updateVolume(0.5);

    expect(clip.volume).toBe(0.5);
    expect(clip.version).toBe(originalVersion + 1);
  });

  test('should clamp volume between 0 and 1', () => {
    clip.updateVolume(-1);
    expect(clip.volume).toBe(0);

    clip.updateVolume(2);
    expect(clip.volume).toBe(1);
  });

  test('should update pan', () => {
    const originalVersion = clip.version;
    clip.updatePan(0.5);

    expect(clip.pan).toBe(0.5);
    expect(clip.version).toBe(originalVersion + 1);
  });

  test('should clamp pan between -1 and 1', () => {
    clip.updatePan(-2);
    expect(clip.pan).toBe(-1);

    clip.updatePan(2);
    expect(clip.pan).toBe(1);
  });

  test('should toggle mute', () => {
    const originalVersion = clip.version;
    clip.toggleMute();

    expect(clip.muted).toBe(true);
    expect(clip.version).toBe(originalVersion + 1);

    clip.toggleMute();
    expect(clip.muted).toBe(false);
    expect(clip.version).toBe(originalVersion + 2);
  });

  test('should toggle solo', () => {
    const originalVersion = clip.version;
    clip.toggleSolo();

    expect(clip.soloed).toBe(true);
    expect(clip.version).toBe(originalVersion + 1);

    clip.toggleSolo();
    expect(clip.soloed).toBe(false);
    expect(clip.version).toBe(originalVersion + 2);
  });

  test('should add effect', () => {
    const originalVersion = clip.version;
    clip.addEffect('effect1');

    expect(clip.effects).toEqual(['effect1']);
    expect(clip.version).toBe(originalVersion + 1);
  });

  test('should not add duplicate effect', () => {
    clip.addEffect('effect1');
    const originalVersion = clip.version;
    clip.addEffect('effect1');

    expect(clip.effects).toEqual(['effect1']);
    expect(clip.version).toBe(originalVersion);
  });

  test('should remove effect', () => {
    clip.addEffect('effect1');
    const originalVersion = clip.version;
    clip.removeEffect('effect1');

    expect(clip.effects).toEqual([]);
    expect(clip.version).toBe(originalVersion + 1);
  });

  test('should update automation', () => {
    const originalVersion = clip.version;
    clip.updateAutomation('volume', [0, 1, 0]);

    expect(clip.automation).toEqual({ volume: [0, 1, 0] });
    expect(clip.version).toBe(originalVersion + 1);
  });
}); 