import { TrackImpl } from '../../../data/models/Track';

describe('TrackImpl', () => {
  let track: TrackImpl;

  beforeEach(() => {
    track = new TrackImpl({});
  });

  test('should create with default values', () => {
    expect(track.name).toBe('Untitled Track');
    expect(track.type).toBe('audio');
    expect(track.clips).toEqual([]);
    expect(track.volume).toBe(1);
    expect(track.pan).toBe(0);
    expect(track.muted).toBe(false);
    expect(track.soloed).toBe(false);
    expect(track.effects).toEqual([]);
    expect(track.automation).toEqual({});
    expect(track.inputGain).toBe(1);
    expect(track.outputGain).toBe(1);
    expect(track.color).toBe('#808080');
    expect(track.height).toBe(100);
    expect(track.visible).toBe(true);
  });

  test('should create with provided values', () => {
    const track = new TrackImpl({
      name: 'Test Track',
      type: 'midi',
      clips: ['clip1', 'clip2'],
      volume: 0.8,
      pan: 0.5,
      muted: true,
      soloed: false,
      effects: ['effect1', 'effect2'],
      automation: { volume: [0, 1, 0] },
      inputGain: 1.2,
      outputGain: 0.8,
      color: '#FF0000',
      height: 150,
      visible: false
    });

    expect(track.name).toBe('Test Track');
    expect(track.type).toBe('midi');
    expect(track.clips).toEqual(['clip1', 'clip2']);
    expect(track.volume).toBe(0.8);
    expect(track.pan).toBe(0.5);
    expect(track.muted).toBe(true);
    expect(track.soloed).toBe(false);
    expect(track.effects).toEqual(['effect1', 'effect2']);
    expect(track.automation).toEqual({ volume: [0, 1, 0] });
    expect(track.inputGain).toBe(1.2);
    expect(track.outputGain).toBe(0.8);
    expect(track.color).toBe('#FF0000');
    expect(track.height).toBe(150);
    expect(track.visible).toBe(false);
  });

  test('should add clip', () => {
    const originalVersion = track.version;
    track.addClip('clip1');

    expect(track.clips).toEqual(['clip1']);
    expect(track.version).toBe(originalVersion + 1);
  });

  test('should not add duplicate clip', () => {
    track.addClip('clip1');
    const originalVersion = track.version;
    track.addClip('clip1');

    expect(track.clips).toEqual(['clip1']);
    expect(track.version).toBe(originalVersion);
  });

  test('should remove clip', () => {
    track.addClip('clip1');
    const originalVersion = track.version;
    track.removeClip('clip1');

    expect(track.clips).toEqual([]);
    expect(track.version).toBe(originalVersion + 1);
  });

  test('should update volume', () => {
    const originalVersion = track.version;
    track.updateVolume(0.5);

    expect(track.volume).toBe(0.5);
    expect(track.version).toBe(originalVersion + 1);
  });

  test('should clamp volume between 0 and 1', () => {
    track.updateVolume(-1);
    expect(track.volume).toBe(0);

    track.updateVolume(2);
    expect(track.volume).toBe(1);
  });

  test('should update pan', () => {
    const originalVersion = track.version;
    track.updatePan(0.5);

    expect(track.pan).toBe(0.5);
    expect(track.version).toBe(originalVersion + 1);
  });

  test('should clamp pan between -1 and 1', () => {
    track.updatePan(-2);
    expect(track.pan).toBe(-1);

    track.updatePan(2);
    expect(track.pan).toBe(1);
  });

  test('should toggle mute', () => {
    const originalVersion = track.version;
    track.toggleMute();

    expect(track.muted).toBe(true);
    expect(track.version).toBe(originalVersion + 1);

    track.toggleMute();
    expect(track.muted).toBe(false);
    expect(track.version).toBe(originalVersion + 2);
  });

  test('should toggle solo', () => {
    const originalVersion = track.version;
    track.toggleSolo();

    expect(track.soloed).toBe(true);
    expect(track.version).toBe(originalVersion + 1);

    track.toggleSolo();
    expect(track.soloed).toBe(false);
    expect(track.version).toBe(originalVersion + 2);
  });

  test('should add effect', () => {
    const originalVersion = track.version;
    track.addEffect('effect1');

    expect(track.effects).toEqual(['effect1']);
    expect(track.version).toBe(originalVersion + 1);
  });

  test('should not add duplicate effect', () => {
    track.addEffect('effect1');
    const originalVersion = track.version;
    track.addEffect('effect1');

    expect(track.effects).toEqual(['effect1']);
    expect(track.version).toBe(originalVersion);
  });

  test('should remove effect', () => {
    track.addEffect('effect1');
    const originalVersion = track.version;
    track.removeEffect('effect1');

    expect(track.effects).toEqual([]);
    expect(track.version).toBe(originalVersion + 1);
  });

  test('should update automation', () => {
    const originalVersion = track.version;
    track.updateAutomation('volume', [0, 1, 0]);

    expect(track.automation).toEqual({ volume: [0, 1, 0] });
    expect(track.version).toBe(originalVersion + 1);
  });

  test('should update input gain', () => {
    const originalVersion = track.version;
    track.updateInputGain(1.2);

    expect(track.inputGain).toBe(1.2);
    expect(track.version).toBe(originalVersion + 1);
  });

  test('should not allow negative input gain', () => {
    track.updateInputGain(-1);
    expect(track.inputGain).toBe(0);
  });

  test('should update output gain', () => {
    const originalVersion = track.version;
    track.updateOutputGain(0.8);

    expect(track.outputGain).toBe(0.8);
    expect(track.version).toBe(originalVersion + 1);
  });

  test('should not allow negative output gain', () => {
    track.updateOutputGain(-1);
    expect(track.outputGain).toBe(0);
  });

  test('should update color', () => {
    const originalVersion = track.version;
    track.updateColor('#FF0000');

    expect(track.color).toBe('#FF0000');
    expect(track.version).toBe(originalVersion + 1);
  });

  test('should update height', () => {
    const originalVersion = track.version;
    track.updateHeight(150);

    expect(track.height).toBe(150);
    expect(track.version).toBe(originalVersion + 1);
  });

  test('should clamp height between 50 and 300', () => {
    track.updateHeight(30);
    expect(track.height).toBe(50);

    track.updateHeight(350);
    expect(track.height).toBe(300);
  });

  test('should toggle visibility', () => {
    const originalVersion = track.version;
    track.toggleVisibility();

    expect(track.visible).toBe(false);
    expect(track.version).toBe(originalVersion + 1);

    track.toggleVisibility();
    expect(track.visible).toBe(true);
    expect(track.version).toBe(originalVersion + 2);
  });
}); 