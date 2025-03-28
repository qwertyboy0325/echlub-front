import { TrackRepository } from '../../../data/repositories/TrackRepository';
import { Track, AudioClip, Effect } from '../../../data/models/Track';

describe('TrackRepository', () => {
    let trackRepository: TrackRepository;
    
    beforeEach(() => {
        trackRepository = new TrackRepository();
    });
    
    afterEach(() => {
        trackRepository.clear();
    });
    
    test('should create track', () => {
        const track = trackRepository.createTrack({
            name: 'Test Track',
            type: 'audio'
        });
        
        expect(track.id).toBeDefined();
        expect(track.name).toBe('Test Track');
        expect(track.type).toBe('audio');
        expect(track.volume).toBe(1);
        expect(track.pan).toBe(0);
        expect(track.muted).toBe(false);
        expect(track.soloed).toBe(false);
        expect(track.clips).toHaveLength(0);
        expect(track.effects).toHaveLength(0);
    });
    
    test('should get track by ID', () => {
        const track = trackRepository.createTrack({
            name: 'Test Track'
        });
        
        const retrievedTrack = trackRepository.getTrack(track.id);
        expect(retrievedTrack).toBeDefined();
        expect(retrievedTrack?.id).toBe(track.id);
    });
    
    test('should update track', () => {
        const track = trackRepository.createTrack({
            name: 'Test Track'
        });
        
        const updatedTrack = trackRepository.updateTrack(track.id, {
            name: 'Updated Track',
            volume: 0.8
        });
        
        expect(updatedTrack).toBeDefined();
        expect(updatedTrack?.name).toBe('Updated Track');
        expect(updatedTrack?.volume).toBe(0.8);
    });
    
    test('should delete track', () => {
        const track = trackRepository.createTrack({
            name: 'Test Track'
        });
        
        const deleted = trackRepository.deleteTrack(track.id);
        expect(deleted).toBe(true);
        expect(trackRepository.getTrack(track.id)).toBeUndefined();
    });
    
    test('should manage audio clips', () => {
        const track = trackRepository.createTrack({
            name: 'Test Track'
        });
        
        const clip: AudioClip = {
            id: 'clip1',
            trackId: track.id,
            name: 'Test Clip',
            startTime: 0,
            duration: 10,
            loop: false,
            loopStart: 0,
            loopEnd: 10,
            audioData: {
                buffer: new Float32Array(),
                sampleRate: 44100,
                channels: 2,
                duration: 10
            },
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        
        // Add clip
        const trackWithClip = trackRepository.addClip(track.id, clip);
        expect(trackWithClip?.clips).toHaveLength(1);
        expect(trackWithClip?.clips[0].id).toBe(clip.id);
        
        // Update clip
        const updatedTrack = trackRepository.updateClip(track.id, clip.id, {
            name: 'Updated Clip'
        });
        expect(updatedTrack?.clips[0].name).toBe('Updated Clip');
        
        // Remove clip
        const trackWithoutClip = trackRepository.removeClip(track.id, clip.id);
        expect(trackWithoutClip?.clips).toHaveLength(0);
    });
    
    test('should manage effects', () => {
        const track = trackRepository.createTrack({
            name: 'Test Track'
        });
        
        const effect: Effect = {
            id: 'effect1',
            type: 'delay',
            parameters: { delay: 0.5, feedback: 0.3 },
            enabled: true,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        
        // Add effect
        const trackWithEffect = trackRepository.addEffect(track.id, effect);
        expect(trackWithEffect?.effects).toHaveLength(1);
        expect(trackWithEffect?.effects[0].id).toBe(effect.id);
        
        // Update effect
        const updatedTrack = trackRepository.updateEffect(track.id, effect.id, {
            parameters: { delay: 0.7, feedback: 0.5 }
        });
        expect(updatedTrack?.effects[0].parameters.delay).toBe(0.7);
        expect(updatedTrack?.effects[0].parameters.feedback).toBe(0.5);
        
        // Remove effect
        const trackWithoutEffect = trackRepository.removeEffect(track.id, effect.id);
        expect(trackWithoutEffect?.effects).toHaveLength(0);
    });
    
    test('should handle non-existent track operations', () => {
        const nonExistentId = 'non-existent';
        
        expect(trackRepository.getTrack(nonExistentId)).toBeUndefined();
        expect(trackRepository.updateTrack(nonExistentId, { name: 'New Name' })).toBeUndefined();
        expect(trackRepository.deleteTrack(nonExistentId)).toBe(false);
        expect(trackRepository.addClip(nonExistentId, {} as AudioClip)).toBeUndefined();
        expect(trackRepository.removeClip(nonExistentId, 'clip1')).toBeUndefined();
        expect(trackRepository.addEffect(nonExistentId, {} as Effect)).toBeUndefined();
        expect(trackRepository.removeEffect(nonExistentId, 'effect1')).toBeUndefined();
    });
}); 