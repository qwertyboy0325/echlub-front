import { AudioRepositoryImpl } from '../../../data/repositories/AudioRepository';

describe('AudioRepositoryImpl', () => {
  let repository: AudioRepositoryImpl;

  beforeEach(() => {
    repository = new AudioRepositoryImpl();
  });

  test('should create new audio', () => {
    const audio = repository.create({});
    expect(audio).toBeDefined();
    expect(audio.name).toBe('Untitled Audio');
    expect(audio.duration).toBe(0);
    expect(audio.sampleRate).toBe(44100);
    expect(audio.channels).toBe(2);
    expect(audio.bitDepth).toBe(16);
    expect(audio.filePath).toBe('');
    expect(audio.waveform).toEqual([]);
    expect(audio.metadata).toEqual({});
  });

  test('should create audio with provided values', () => {
    const audio = repository.create({
      name: 'Test Audio',
      duration: 120,
      sampleRate: 48000,
      channels: 1,
      bitDepth: 24,
      filePath: '/path/to/audio.wav',
      waveform: [0, 1, 0],
      metadata: { artist: 'Test Artist' }
    });

    expect(audio.name).toBe('Test Audio');
    expect(audio.duration).toBe(120);
    expect(audio.sampleRate).toBe(48000);
    expect(audio.channels).toBe(1);
    expect(audio.bitDepth).toBe(24);
    expect(audio.filePath).toBe('/path/to/audio.wav');
    expect(audio.waveform).toEqual([0, 1, 0]);
    expect(audio.metadata).toEqual({ artist: 'Test Artist' });
  });

  test('should get audio by name', () => {
    const audio = repository.create({ name: 'Test Audio' });
    const retrieved = repository.getByName('Test Audio');
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(audio.id);
  });

  test('should return undefined for non-existent name', () => {
    const retrieved = repository.getByName('Non-existent');
    expect(retrieved).toBeUndefined();
  });

  test('should get all audio files', () => {
    repository.create({ filePath: '/path1.wav' });
    repository.create({ filePath: '/path2.wav' });
    repository.create({ filePath: '' }); // No file path

    const audioFiles = repository.getAllAudioFiles();
    expect(audioFiles).toHaveLength(2);
    expect(audioFiles.every(audio => audio.filePath !== '')).toBe(true);
  });

  test('should get audio by file path', () => {
    const audio = repository.create({ filePath: '/path/to/audio.wav' });
    const retrieved = repository.getByFilePath('/path/to/audio.wav');
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(audio.id);
  });

  test('should return undefined for non-existent file path', () => {
    const retrieved = repository.getByFilePath('/non-existent.wav');
    expect(retrieved).toBeUndefined();
  });

  test('should update audio metadata', () => {
    const audio = repository.create({});
    const originalVersion = audio.version;
    audio.updateMetadata({ artist: 'Test Artist' });

    expect(audio.metadata).toEqual({ artist: 'Test Artist' });
    expect(audio.version).toBe(originalVersion + 1);
  });

  test('should merge audio metadata', () => {
    const audio = repository.create({});
    audio.updateMetadata({ artist: 'Test Artist' });
    audio.updateMetadata({ album: 'Test Album' });

    expect(audio.metadata).toEqual({
      artist: 'Test Artist',
      album: 'Test Album'
    });
  });

  test('should update waveform data', () => {
    const audio = repository.create({});
    const originalVersion = audio.version;
    const newWaveform = [0, 1, 0, -1, 0];
    audio.updateWaveform(newWaveform);

    expect(audio.waveform).toEqual(newWaveform);
    expect(audio.version).toBe(originalVersion + 1);
  });
}); 