import { TrackImpl } from '../../../domain/models/Track';

describe('TrackImpl', () => {
  let track: TrackImpl;

  beforeEach(() => {
    track = new TrackImpl('Test Track');
  });

  test('should create with default values', () => {
    expect(track.name).toBe('Test Track');
    expect(track.clips).toEqual([]);
    expect(track.volume).toBe(1);
    expect(track.pan).toBe(0);
    expect(track.reverb).toBe(0);
  });

  test('should add and remove clips', () => {
    const clip = { id: 'clip-1', name: 'Test Clip' } as any;
    track.addClip(clip);
    expect(track.clips).toContain(clip);

    track.removeClip('clip-1');
    expect(track.clips).not.toContain(clip);
  });

  test('should update volume', () => {
    track.updateVolume(0.5);
    expect(track.volume).toBe(0.5);
  });

  test('should update pan', () => {
    track.updatePan(0.5);
    expect(track.pan).toBe(0.5);
  });

  test('should update reverb', () => {
    track.updateReverb(0.5);
    expect(track.reverb).toBe(0.5);
  });
}); 