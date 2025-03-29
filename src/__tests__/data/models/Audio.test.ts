import { AudioImpl } from '../../../data/models/Audio';

describe('AudioImpl', () => {
  test('should create with default values', () => {
    const audio = new AudioImpl({});
    expect(audio.name).toBe('Untitled Audio');
    expect(audio.duration).toBe(0);
    expect(audio.sampleRate).toBe(44100);
    expect(audio.channels).toBe(2);
    expect(audio.bitDepth).toBe(16);
    expect(audio.filePath).toBe('');
    expect(audio.waveform).toEqual([]);
    expect(audio.metadata).toEqual({});
  });

  test('should create with provided values', () => {
    const audio = new AudioImpl({
      name: 'Test Audio',
      duration: 180,
      sampleRate: 48000,
      channels: 1,
      bitDepth: 24,
      filePath: '/path/to/audio.wav',
      waveform: [0, 1, 0, -1, 0],
      metadata: { artist: 'Test Artist', genre: 'Test Genre' }
    });

    expect(audio.name).toBe('Test Audio');
    expect(audio.duration).toBe(180);
    expect(audio.sampleRate).toBe(48000);
    expect(audio.channels).toBe(1);
    expect(audio.bitDepth).toBe(24);
    expect(audio.filePath).toBe('/path/to/audio.wav');
    expect(audio.waveform).toEqual([0, 1, 0, -1, 0]);
    expect(audio.metadata).toEqual({ artist: 'Test Artist', genre: 'Test Genre' });
  });

  test('should update metadata', () => {
    const audio = new AudioImpl({});
    const originalVersion = audio.version;
    audio.updateMetadata({ artist: 'Test Artist' });

    expect(audio.metadata).toEqual({ artist: 'Test Artist' });
    expect(audio.version).toBe(originalVersion + 1);
  });

  test('should merge metadata', () => {
    const audio = new AudioImpl({});
    audio.updateMetadata({ artist: 'Test Artist' });
    audio.updateMetadata({ genre: 'Test Genre' });

    expect(audio.metadata).toEqual({
      artist: 'Test Artist',
      genre: 'Test Genre'
    });
  });

  test('should update waveform', () => {
    const audio = new AudioImpl({});
    const originalVersion = audio.version;
    audio.updateWaveform([0, 1, 0, -1, 0]);

    expect(audio.waveform).toEqual([0, 1, 0, -1, 0]);
    expect(audio.version).toBe(originalVersion + 1);
  });
}); 