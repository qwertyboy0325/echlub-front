import { AudioImpl } from '../../../data/models/Audio';

describe('AudioImpl', () => {
  test('should initialize with default values', () => {
    const audio = new AudioImpl('Test Audio', 'test-url', 10, 44100, 2, 'wav');
    expect(audio.name).toBe('Test Audio');
    expect(audio.url).toBe('test-url');
    expect(audio.duration).toBe(10);
    expect(audio.sampleRate).toBe(44100);
    expect(audio.channels).toBe(2);
    expect(audio.format).toBe('wav');
    expect(audio.metadata).toEqual({});
  });

  test('should not allow zero or negative sample rate', () => {
    expect(() => new AudioImpl('Test Audio', 'test-url', 10, 0, 2, 'wav')).toThrow('Sample rate must be positive');
    expect(() => new AudioImpl('Test Audio', 'test-url', 10, -1, 2, 'wav')).toThrow('Sample rate must be positive');
  });

  test('should not allow zero or negative channels', () => {
    expect(() => new AudioImpl('Test Audio', 'test-url', 10, 44100, 0, 'wav')).toThrow('Channels must be positive');
    expect(() => new AudioImpl('Test Audio', 'test-url', 10, 44100, -1, 'wav')).toThrow('Channels must be positive');
  });

  test('should update metadata', () => {
    const audio = new AudioImpl('Test Audio', 'test-url', 10, 44100, 2, 'wav');
    const originalVersion = audio.version;
    
    audio.updateMetadata({ artist: 'Test Artist' });
    expect(audio.metadata).toEqual({ artist: 'Test Artist' });
    expect(audio.version).toBe(originalVersion + 1);
  });

  test('should merge metadata', () => {
    const audio = new AudioImpl('Test Audio', 'test-url', 10, 44100, 2, 'wav');
    const originalVersion = audio.version;
    
    audio.updateMetadata({ artist: 'Test Artist' });
    audio.updateMetadata({ album: 'Test Album' });
    expect(audio.metadata).toEqual({
      artist: 'Test Artist',
      album: 'Test Album'
    });
    expect(audio.version).toBe(originalVersion + 2);
  });

  test('should update duration', () => {
    const audio = new AudioImpl('Test Audio', 'test-url', 10, 44100, 2, 'wav');
    const originalVersion = audio.version;
    
    audio.updateDuration(20);
    expect(audio.duration).toBe(20);
    expect(audio.version).toBe(originalVersion + 1);
  });

  test('should not allow negative duration', () => {
    const audio = new AudioImpl('Test Audio', 'test-url', 10, 44100, 2, 'wav');
    expect(() => audio.updateDuration(-1)).toThrow('Duration must be non-negative');
  });
}); 