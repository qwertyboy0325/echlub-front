import { TrackRepositoryImpl } from '../../../data/repositories/TrackRepository';
import { TrackImpl } from '../../../data/models/Track';

describe('TrackRepositoryImpl', () => {
    let repository: TrackRepositoryImpl;
    
    beforeEach(() => {
        repository = new TrackRepositoryImpl();
    });
    
    test('should create new track', () => {
        const track = repository.create({});
        expect(track).toBeDefined();
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
    
    test('should create track with provided values', () => {
        const track = repository.create({
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
    
    test('should get tracks by name', () => {
        repository.create({ name: 'Test Track' });
        repository.create({ name: 'Test Track' });
        repository.create({ name: 'Other Track' });

        const tracks = repository.getByName('Test Track');
        expect(tracks).toHaveLength(2);
        expect(tracks.every(track => track.name === 'Test Track')).toBe(true);
    });
    
    test('should return empty array for non-existent name', () => {
        const tracks = repository.getByName('Non-existent');
        expect(tracks).toEqual([]);
    });
    
    test('should get tracks by type', () => {
        repository.create({ type: 'audio' });
        repository.create({ type: 'audio' });
        repository.create({ type: 'midi' });

        const audioTracks = repository.getByType('audio');
        expect(audioTracks).toHaveLength(2);
        expect(audioTracks.every(track => track.type === 'audio')).toBe(true);

        const midiTracks = repository.getByType('midi');
        expect(midiTracks).toHaveLength(1);
        expect(midiTracks[0].type).toBe('midi');
    });
    
    test('should get visible tracks', () => {
        repository.create({ visible: true });
        repository.create({ visible: true });
        repository.create({ visible: false });

        const visibleTracks = repository.getVisible();
        expect(visibleTracks).toHaveLength(2);
        expect(visibleTracks.every(track => track.visible)).toBe(true);
    });
    
    test('should get muted tracks', () => {
        repository.create({ muted: true });
        repository.create({ muted: true });
        repository.create({ muted: false });

        const mutedTracks = repository.getMuted();
        expect(mutedTracks).toHaveLength(2);
        expect(mutedTracks.every(track => track.muted)).toBe(true);
    });
    
    test('should get soloed tracks', () => {
        repository.create({ soloed: true });
        repository.create({ soloed: true });
        repository.create({ soloed: false });

        const soloedTracks = repository.getSoloed();
        expect(soloedTracks).toHaveLength(2);
        expect(soloedTracks.every(track => track.soloed)).toBe(true);
    });
    
    test('should get tracks with effects', () => {
        repository.create({ effects: ['effect1'] });
        repository.create({ effects: ['effect2'] });
        repository.create({ effects: [] });

        const tracksWithEffects = repository.getWithEffects();
        expect(tracksWithEffects).toHaveLength(2);
        expect(tracksWithEffects.every(track => track.effects.length > 0)).toBe(true);
    });
    
    test('should update track volume', () => {
        const track = repository.create({}) as TrackImpl;
        const originalVersion = track.version;
        track.updateVolume(0.5);

        expect(track.volume).toBe(0.5);
        expect(track.version).toBe(originalVersion + 1);
    });
    
    test('should clamp volume between 0 and 1', () => {
        const track = repository.create({}) as TrackImpl;
        track.updateVolume(-1);
        expect(track.volume).toBe(0);

        track.updateVolume(2);
        expect(track.volume).toBe(1);
    });
    
    test('should update track pan', () => {
        const track = repository.create({}) as TrackImpl;
        const originalVersion = track.version;
        track.updatePan(0.5);

        expect(track.pan).toBe(0.5);
        expect(track.version).toBe(originalVersion + 1);
    });
    
    test('should clamp pan between -1 and 1', () => {
        const track = repository.create({}) as TrackImpl;
        track.updatePan(-2);
        expect(track.pan).toBe(-1);

        track.updatePan(2);
        expect(track.pan).toBe(1);
    });
    
    test('should toggle track mute', () => {
        const track = repository.create({}) as TrackImpl;
        const originalVersion = track.version;
        track.toggleMute();

        expect(track.muted).toBe(true);
        expect(track.version).toBe(originalVersion + 1);

        track.toggleMute();
        expect(track.muted).toBe(false);
        expect(track.version).toBe(originalVersion + 2);
    });
    
    test('should toggle track solo', () => {
        const track = repository.create({}) as TrackImpl;
        const originalVersion = track.version;
        track.toggleSolo();

        expect(track.soloed).toBe(true);
        expect(track.version).toBe(originalVersion + 1);

        track.toggleSolo();
        expect(track.soloed).toBe(false);
        expect(track.version).toBe(originalVersion + 2);
    });
    
    test('should add effect to track', () => {
        const track = repository.create({}) as TrackImpl;
        const originalVersion = track.version;
        track.addEffect('effect1');

        expect(track.effects).toEqual(['effect1']);
        expect(track.version).toBe(originalVersion + 1);
    });
    
    test('should not add duplicate effect', () => {
        const track = repository.create({}) as TrackImpl;
        track.addEffect('effect1');
        const originalVersion = track.version;
        track.addEffect('effect1');

        expect(track.effects).toEqual(['effect1']);
        expect(track.version).toBe(originalVersion);
    });
    
    test('should remove effect from track', () => {
        const track = repository.create({}) as TrackImpl;
        track.addEffect('effect1');
        const originalVersion = track.version;
        track.removeEffect('effect1');

        expect(track.effects).toEqual([]);
        expect(track.version).toBe(originalVersion + 1);
    });
    
    test('should update automation data', () => {
        const track = repository.create({}) as TrackImpl;
        const originalVersion = track.version;
        track.updateAutomation('volume', [0, 1, 0]);

        expect(track.automation).toEqual({ volume: [0, 1, 0] });
        expect(track.version).toBe(originalVersion + 1);
    });
    
    test('should update input gain', () => {
        const track = repository.create({}) as TrackImpl;
        const originalVersion = track.version;
        track.updateInputGain(1.2);

        expect(track.inputGain).toBe(1.2);
        expect(track.version).toBe(originalVersion + 1);
    });
    
    test('should not allow negative input gain', () => {
        const track = repository.create({}) as TrackImpl;
        track.updateInputGain(-1);
        expect(track.inputGain).toBe(0);
    });
    
    test('should update output gain', () => {
        const track = repository.create({}) as TrackImpl;
        const originalVersion = track.version;
        track.updateOutputGain(0.8);

        expect(track.outputGain).toBe(0.8);
        expect(track.version).toBe(originalVersion + 1);
    });
    
    test('should not allow negative output gain', () => {
        const track = repository.create({}) as TrackImpl;
        track.updateOutputGain(-1);
        expect(track.outputGain).toBe(0);
    });
    
    test('should update color', () => {
        const track = repository.create({}) as TrackImpl;
        const originalVersion = track.version;
        track.updateColor('#FF0000');

        expect(track.color).toBe('#FF0000');
        expect(track.version).toBe(originalVersion + 1);
    });
    
    test('should update height', () => {
        const track = repository.create({}) as TrackImpl;
        const originalVersion = track.version;
        track.updateHeight(150);

        expect(track.height).toBe(150);
        expect(track.version).toBe(originalVersion + 1);
    });
    
    test('should clamp height between 50 and 300', () => {
        const track = repository.create({}) as TrackImpl;
        track.updateHeight(30);
        expect(track.height).toBe(50);

        track.updateHeight(350);
        expect(track.height).toBe(300);
    });
    
    test('should toggle visibility', () => {
        const track = repository.create({}) as TrackImpl;
        const originalVersion = track.version;
        track.toggleVisibility();

        expect(track.visible).toBe(false);
        expect(track.version).toBe(originalVersion + 1);

        track.toggleVisibility();
        expect(track.visible).toBe(true);
        expect(track.version).toBe(originalVersion + 2);
    });
}); 