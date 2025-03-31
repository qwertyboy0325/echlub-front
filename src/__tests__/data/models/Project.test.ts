import { ProjectImpl } from '../../../domain/models/Project';

describe('ProjectImpl', () => {
  test('should create with default values', () => {
    const project = new ProjectImpl('Test Project');
    expect(project.name).toBe('Test Project');
    expect(project.tempo).toBe(120);
    expect(project.tracks).toEqual([]);
    expect(project.isCurrent).toBe(false);
  });

  test('should add and remove tracks', () => {
    const project = new ProjectImpl('Test Project');
    const track = { id: 'track-1', name: 'Test Track' } as any;
    
    project.addTrack(track);
    expect(project.tracks).toContain(track);

    project.removeTrack('track-1');
    expect(project.tracks).not.toContain(track);
  });

  test('should update tempo', () => {
    const project = new ProjectImpl('Test Project');
    project.updateTempo(140);
    expect(project.tempo).toBe(140);
  });

  test('should not allow zero or negative tempo', () => {
    const project = new ProjectImpl('Test Project');
    expect(() => project.updateTempo(0)).toThrow('Tempo must be greater than 0');
    expect(() => project.updateTempo(-1)).toThrow('Tempo must be greater than 0');
  });

  test('should set current project', () => {
    const project = new ProjectImpl('Test Project');
    project.setCurrent(true);
    expect(project.isCurrent).toBe(true);
    
    project.setCurrent(false);
    expect(project.isCurrent).toBe(false);
  });
}); 