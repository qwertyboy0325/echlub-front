import { ProjectRepository } from '../../../data/repositories/ProjectRepository';
import { Project } from '../../../data/models/Project';
import { Track } from '../../../data/models/Track';

describe('ProjectRepository', () => {
    let projectRepository: ProjectRepository;
    
    beforeEach(() => {
        projectRepository = new ProjectRepository();
    });
    
    afterEach(() => {
        projectRepository.clear();
    });
    
    test('should create project', () => {
        const project = projectRepository.createProject({
            name: 'Test Project',
            description: 'Test Description'
        });
        
        expect(project.id).toBeDefined();
        expect(project.name).toBe('Test Project');
        expect(project.description).toBe('Test Description');
        expect(project.tracks).toHaveLength(0);
        expect(project.bpm).toBe(120);
        expect(project.timeSignature).toEqual({ numerator: 4, denominator: 4 });
        expect(project.sampleRate).toBe(44100);
    });
    
    test('should get project by ID', () => {
        const project = projectRepository.createProject({
            name: 'Test Project'
        });
        
        const retrievedProject = projectRepository.getProject(project.id);
        expect(retrievedProject).toBeDefined();
        expect(retrievedProject?.id).toBe(project.id);
    });
    
    test('should update project', () => {
        const project = projectRepository.createProject({
            name: 'Test Project'
        });
        
        const updatedProject = projectRepository.updateProject(project.id, {
            name: 'Updated Project',
            bpm: 140
        });
        
        expect(updatedProject).toBeDefined();
        expect(updatedProject?.name).toBe('Updated Project');
        expect(updatedProject?.bpm).toBe(140);
    });
    
    test('should delete project', () => {
        const project = projectRepository.createProject({
            name: 'Test Project'
        });
        
        const deleted = projectRepository.deleteProject(project.id);
        expect(deleted).toBe(true);
        expect(projectRepository.getProject(project.id)).toBeUndefined();
    });
    
    test('should manage tracks in project', () => {
        const project = projectRepository.createProject({
            name: 'Test Project'
        });
        
        const track: Track = {
            id: 'track1',
            name: 'Test Track',
            type: 'audio',
            volume: 1,
            pan: 0,
            muted: false,
            soloed: false,
            clips: [],
            effects: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        
        // Add track
        const projectWithTrack = projectRepository.addTrack(project.id, track);
        expect(projectWithTrack?.tracks).toHaveLength(1);
        expect(projectWithTrack?.tracks[0].id).toBe(track.id);
        
        // Update track
        const updatedProject = projectRepository.updateTrack(project.id, track.id, {
            name: 'Updated Track',
            volume: 0.8
        });
        expect(updatedProject?.tracks[0].name).toBe('Updated Track');
        expect(updatedProject?.tracks[0].volume).toBe(0.8);
        
        // Get track
        const retrievedTrack = projectRepository.getTrack(project.id, track.id);
        expect(retrievedTrack).toBeDefined();
        expect(retrievedTrack?.id).toBe(track.id);
        
        // Move track
        const movedProject = projectRepository.moveTrack(project.id, track.id, 0);
        expect(movedProject?.tracks[0].id).toBe(track.id);
        
        // Remove track
        const projectWithoutTrack = projectRepository.removeTrack(project.id, track.id);
        expect(projectWithoutTrack?.tracks).toHaveLength(0);
    });
    
    test('should update project settings', () => {
        const project = projectRepository.createProject({
            name: 'Test Project'
        });
        
        // Update BPM
        const projectWithNewBPM = projectRepository.updateBPM(project.id, 140);
        expect(projectWithNewBPM?.bpm).toBe(140);
        
        // Update time signature
        const projectWithNewTimeSignature = projectRepository.updateTimeSignature(
            project.id,
            6,
            8
        );
        expect(projectWithNewTimeSignature?.timeSignature).toEqual({
            numerator: 6,
            denominator: 8
        });
        
        // Update sample rate
        const projectWithNewSampleRate = projectRepository.updateSampleRate(
            project.id,
            48000
        );
        expect(projectWithNewSampleRate?.sampleRate).toBe(48000);
    });
    
    test('should handle non-existent project operations', () => {
        const nonExistentId = 'non-existent';
        
        expect(projectRepository.getProject(nonExistentId)).toBeUndefined();
        expect(projectRepository.updateProject(nonExistentId, { name: 'New Name' })).toBeUndefined();
        expect(projectRepository.deleteProject(nonExistentId)).toBe(false);
        expect(projectRepository.addTrack(nonExistentId, {} as Track)).toBeUndefined();
        expect(projectRepository.removeTrack(nonExistentId, 'track1')).toBeUndefined();
        expect(projectRepository.updateTrack(nonExistentId, 'track1', { name: 'New Name' })).toBeUndefined();
        expect(projectRepository.getTrack(nonExistentId, 'track1')).toBeUndefined();
        expect(projectRepository.moveTrack(nonExistentId, 'track1', 0)).toBeUndefined();
        expect(projectRepository.updateBPM(nonExistentId, 140)).toBeUndefined();
        expect(projectRepository.updateTimeSignature(nonExistentId, 6, 8)).toBeUndefined();
        expect(projectRepository.updateSampleRate(nonExistentId, 48000)).toBeUndefined();
    });
}); 