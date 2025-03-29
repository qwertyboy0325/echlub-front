import { ProjectImpl } from '../../../data/models/Project';

describe('ProjectImpl', () => {
  test('should create with default values', () => {
    const project = new ProjectImpl({});
    expect(project.name).toBe('Untitled Project');
    expect(project.description).toBe('');
    expect(project.tracks).toEqual([]);
    expect(project.tempo).toBe(120);
    expect(project.timeSignature).toEqual([4, 4]);
    expect(project.sampleRate).toBe(44100);
    expect(project.bitDepth).toBe(24);
    expect(project.startTime).toBe(0);
    expect(project.endTime).toBe(0);
    expect(project.loopStart).toBe(0);
    expect(project.loopEnd).toBe(0);
    expect(project.markers).toEqual({});
    expect(project.metadata).toEqual({});
  });

  test('should create with provided values', () => {
    const project = new ProjectImpl({
      name: 'Test Project',
      description: 'Test Description',
      tracks: ['track1', 'track2'],
      tempo: 140,
      timeSignature: [3, 4],
      sampleRate: 48000,
      bitDepth: 32,
      startTime: 10,
      endTime: 100,
      loopStart: 20,
      loopEnd: 80,
      markers: { 'Verse 1': 0, 'Chorus': 32 },
      metadata: { artist: 'Test Artist', genre: 'Test Genre' }
    });

    expect(project.name).toBe('Test Project');
    expect(project.description).toBe('Test Description');
    expect(project.tracks).toEqual(['track1', 'track2']);
    expect(project.tempo).toBe(140);
    expect(project.timeSignature).toEqual([3, 4]);
    expect(project.sampleRate).toBe(48000);
    expect(project.bitDepth).toBe(32);
    expect(project.startTime).toBe(10);
    expect(project.endTime).toBe(100);
    expect(project.loopStart).toBe(20);
    expect(project.loopEnd).toBe(80);
    expect(project.markers).toEqual({ 'Verse 1': 0, 'Chorus': 32 });
    expect(project.metadata).toEqual({ artist: 'Test Artist', genre: 'Test Genre' });
  });

  test('should add track', () => {
    const project = new ProjectImpl({});
    const originalVersion = project.version;
    project.addTrack('track1');

    expect(project.tracks).toEqual(['track1']);
    expect(project.version).toBe(originalVersion + 1);
  });

  test('should not add duplicate track', () => {
    const project = new ProjectImpl({});
    project.addTrack('track1');
    const originalVersion = project.version;
    project.addTrack('track1');

    expect(project.tracks).toEqual(['track1']);
    expect(project.version).toBe(originalVersion);
  });

  test('should remove track', () => {
    const project = new ProjectImpl({});
    project.addTrack('track1');
    const originalVersion = project.version;
    project.removeTrack('track1');

    expect(project.tracks).toEqual([]);
    expect(project.version).toBe(originalVersion + 1);
  });

  test('should update tempo', () => {
    const project = new ProjectImpl({});
    const originalVersion = project.version;
    project.updateTempo(140);

    expect(project.tempo).toBe(140);
    expect(project.version).toBe(originalVersion + 1);
  });

  test('should not allow negative tempo', () => {
    const project = new ProjectImpl({});
    project.updateTempo(-1);
    expect(project.tempo).toBe(1);
  });

  test('should update time signature', () => {
    const project = new ProjectImpl({});
    const originalVersion = project.version;
    project.updateTimeSignature(3, 4);

    expect(project.timeSignature).toEqual([3, 4]);
    expect(project.version).toBe(originalVersion + 1);
  });

  test('should update sample rate', () => {
    const project = new ProjectImpl({});
    const originalVersion = project.version;
    project.updateSampleRate(48000);

    expect(project.sampleRate).toBe(48000);
    expect(project.version).toBe(originalVersion + 1);
  });

  test('should update bit depth', () => {
    const project = new ProjectImpl({});
    const originalVersion = project.version;
    project.updateBitDepth(32);

    expect(project.bitDepth).toBe(32);
    expect(project.version).toBe(originalVersion + 1);
  });

  test('should update time range', () => {
    const project = new ProjectImpl({});
    const originalVersion = project.version;
    project.updateTimeRange(10, 100);

    expect(project.startTime).toBe(10);
    expect(project.endTime).toBe(100);
    expect(project.version).toBe(originalVersion + 1);
  });

  test('should not allow negative start time', () => {
    const project = new ProjectImpl({});
    project.updateTimeRange(-1, 100);
    expect(project.startTime).toBe(0);
  });

  test('should not allow end time before start time', () => {
    const project = new ProjectImpl({});
    project.updateTimeRange(100, 50);
    expect(project.endTime).toBe(100);
  });

  test('should update loop points', () => {
    const project = new ProjectImpl({});
    const originalVersion = project.version;
    project.updateLoopPoints(20, 80);

    expect(project.loopStart).toBe(20);
    expect(project.loopEnd).toBe(80);
    expect(project.version).toBe(originalVersion + 1);
  });

  test('should not allow negative loop start', () => {
    const project = new ProjectImpl({});
    project.updateLoopPoints(-1, 80);
    expect(project.loopStart).toBe(0);
  });

  test('should not allow loop end before loop start', () => {
    const project = new ProjectImpl({});
    project.updateLoopPoints(80, 20);
    expect(project.loopEnd).toBe(80);
  });

  test('should add marker', () => {
    const project = new ProjectImpl({});
    const originalVersion = project.version;
    project.addMarker('Verse 1', 0);

    expect(project.markers).toEqual({ 'Verse 1': 0 });
    expect(project.version).toBe(originalVersion + 1);
  });

  test('should not allow negative marker time', () => {
    const project = new ProjectImpl({});
    project.addMarker('Verse 1', -1);
    expect(project.markers['Verse 1']).toBe(0);
  });

  test('should remove marker', () => {
    const project = new ProjectImpl({});
    project.addMarker('Verse 1', 0);
    const originalVersion = project.version;
    project.removeMarker('Verse 1');

    expect(project.markers).toEqual({});
    expect(project.version).toBe(originalVersion + 1);
  });

  test('should update metadata', () => {
    const project = new ProjectImpl({});
    const originalVersion = project.version;
    project.updateMetadata({ artist: 'Test Artist' });

    expect(project.metadata).toEqual({ artist: 'Test Artist' });
    expect(project.version).toBe(originalVersion + 1);
  });

  test('should merge metadata', () => {
    const project = new ProjectImpl({});
    project.updateMetadata({ artist: 'Test Artist' });
    project.updateMetadata({ genre: 'Test Genre' });

    expect(project.metadata).toEqual({
      artist: 'Test Artist',
      genre: 'Test Genre'
    });
  });
}); 