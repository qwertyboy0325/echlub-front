import { ProjectRepositoryImpl } from '../../../data/repositories/ProjectRepository';
import { ProjectImpl } from '../../../data/models/Project';
import { TrackImpl } from '../../../data/models/Track';

describe('ProjectRepositoryImpl', () => {
    let repository: ProjectRepositoryImpl;
    
    beforeEach(() => {
        repository = new ProjectRepositoryImpl();
    });
    
    test('should create project', () => {
        const project = repository.create({});
        expect(project).toBeDefined();
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
    
    test('should create project with provided values', () => {
        const project = repository.create({
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
    
    test('should get project by ID', () => {
        const project = repository.create({ name: 'Test Project' });
        const retrievedProject = repository.getById(project.id);
        expect(retrievedProject).toBeDefined();
        expect(retrievedProject?.id).toBe(project.id);
    });
    
    test('should update project', () => {
        const project = repository.create({ name: 'Test Project' });
        const updatedProject = repository.update(project.id, {
            name: 'Updated Project',
            tempo: 140
        });

        expect(updatedProject).toBeDefined();
        expect(updatedProject?.name).toBe('Updated Project');
        expect(updatedProject?.tempo).toBe(140);
    });
    
    test('should delete project', () => {
        const project = repository.create({ name: 'Test Project' });
        const deleted = repository.delete(project.id);
        expect(deleted).toBe(true);
        expect(repository.getById(project.id)).toBeUndefined();
    });
    
    test('should manage tracks in project', () => {
        const project = repository.create({ name: 'Test Project' });
        const track = new TrackImpl({ name: 'Test Track' });

        // Add track
        project.addTrack(track.id);
        expect(project.tracks).toContain(track.id);

        // Remove track
        project.removeTrack(track.id);
        expect(project.tracks).not.toContain(track.id);
    });
    
    test('should update project settings', () => {
        const project = repository.create({ name: 'Test Project' });

        // Update tempo
        project.updateTempo(140);
        expect(project.tempo).toBe(140);

        // Update time signature
        project.updateTimeSignature(3, 4);
        expect(project.timeSignature).toEqual([3, 4]);

        // Update sample rate
        project.updateSampleRate(48000);
        expect(project.sampleRate).toBe(48000);

        // Update bit depth
        project.updateBitDepth(32);
        expect(project.bitDepth).toBe(32);

        // Update time range
        project.updateTimeRange(10, 100);
        expect(project.startTime).toBe(10);
        expect(project.endTime).toBe(100);

        // Update loop points
        project.updateLoopPoints(20, 80);
        expect(project.loopStart).toBe(20);
        expect(project.loopEnd).toBe(80);
    });
    
    test('should handle non-existent project operations', () => {
        const nonExistentId = 'non-existent';
        expect(repository.getById(nonExistentId)).toBeUndefined();
        expect(repository.update(nonExistentId, { name: 'New Name' })).toBeUndefined();
        expect(repository.delete(nonExistentId)).toBe(false);
    });
    
    test('should get projects by name', () => {
        repository.create({ name: 'Test Project' });
        repository.create({ name: 'Test Project' });
        repository.create({ name: 'Other Project' });

        const projects = repository.getByName('Test Project');
        expect(projects).toHaveLength(2);
        expect(projects.every(project => project.name === 'Test Project')).toBe(true);
    });
    
    test('should get active project', () => {
        const project = repository.create({ name: 'Test Project' });
        repository.setActive(project.id);
        const activeProject = repository.getActive();
        expect(activeProject).toBeDefined();
        expect(activeProject?.id).toBe(project.id);
    });
    
    test('should get projects by tempo', () => {
        repository.create({ tempo: 120 });
        repository.create({ tempo: 120 });
        repository.create({ tempo: 140 });

        const projects = repository.getByTempo(120);
        expect(projects).toHaveLength(2);
        expect(projects.every(project => project.tempo === 120)).toBe(true);
    });
    
    test('should get projects by time signature', () => {
        repository.create({ timeSignature: [4, 4] });
        repository.create({ timeSignature: [4, 4] });
        repository.create({ timeSignature: [3, 4] });

        const projects = repository.getByTimeSignature(4, 4);
        expect(projects).toHaveLength(2);
        expect(projects.every(project => 
            project.timeSignature[0] === 4 && project.timeSignature[1] === 4
        )).toBe(true);
    });
}); 