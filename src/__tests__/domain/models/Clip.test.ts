import { ClipImpl } from '../../../domain/models/Clip';

describe('ClipImpl', () => {
  let clip: ClipImpl;

  beforeEach(() => {
    clip = new ClipImpl('test-audio.mp3', 0, 10, 0, 'test-clip');
  });

  test('should create with default values', () => {
    expect(clip.id).toBeDefined();
    expect(clip.name).toBe('test-clip');
    expect(clip.audioUrl).toBe('test-audio.mp3');
    expect(clip.startTime).toBe(0);
    expect(clip.duration).toBe(10);
    expect(clip.position).toBe(0);
    expect(clip.volume).toBe(1);
    expect(clip.pan).toBe(0);
    expect(clip.muted).toBe(false);
    expect(clip.soloed).toBe(false);
    expect(clip.effects).toEqual([]);
    expect(clip.automation).toEqual({});
    expect(clip.trackId).toBe('');
  });

  test('should update start time', () => {
    clip.updateStartTime(5);
    expect(clip.startTime).toBe(5);
  });

  test('should update position', () => {
    clip.updatePosition(15);
    expect(clip.position).toBe(15);
  });

  test('should update volume', () => {
    clip.updateVolume(0.5);
    expect(clip.volume).toBe(0.5);
  });

  test('should update pan', () => {
    clip.updatePan(0.5);
    expect(clip.pan).toBe(0.5);
  });

  test('should toggle mute', () => {
    clip.toggleMute();
    expect(clip.muted).toBe(true);
    clip.toggleMute();
    expect(clip.muted).toBe(false);
  });

  test('should toggle solo', () => {
    clip.toggleSolo();
    expect(clip.soloed).toBe(true);
    clip.toggleSolo();
    expect(clip.soloed).toBe(false);
  });

  test('should add and remove effects', () => {
    clip.addEffect('reverb-1');
    expect(clip.effects).toContain('reverb-1');
    clip.removeEffect('reverb-1');
    expect(clip.effects).not.toContain('reverb-1');
  });

  test('should update automation', () => {
    clip.updateAutomation('volume', [0, 1, 0]);
    expect(clip.automation.volume).toEqual([0, 1, 0]);
  });

  test('should set track ID', () => {
    clip.trackId = 'track-1';
    expect(clip.trackId).toBe('track-1');
  });

  test('should throw error for invalid duration', () => {
    expect(() => new ClipImpl('test-audio.mp3', 0, 0, 0)).toThrow('Duration must be greater than 0');
  });

  test('should throw error for negative position', () => {
    expect(() => new ClipImpl('test-audio.mp3', 0, 10, -1)).toThrow('Position must be non-negative');
    expect(() => clip.updatePosition(-1)).toThrow('Position must be non-negative');
  });

  test('should throw error for negative start time', () => {
    expect(() => clip.updateStartTime(-1)).toThrow('Start time must be non-negative');
  });

  test('should clamp volume between 0 and 1', () => {
    clip.updateVolume(2);
    expect(clip.volume).toBe(1);
    clip.updateVolume(-1);
    expect(clip.volume).toBe(0);
  });

  test('should clamp pan between -1 and 1', () => {
    clip.updatePan(2);
    expect(clip.pan).toBe(1);
    clip.updatePan(-2);
    expect(clip.pan).toBe(-1);
  });
}); 