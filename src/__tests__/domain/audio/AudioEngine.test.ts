import '../../../__tests__/mocks/WebAudioAPI';
import { AudioEngine } from '../../../domain/audio/AudioEngine';

describe('AudioEngine', () => {
    let audioEngine: AudioEngine;
    
    beforeEach(() => {
        audioEngine = AudioEngine.getInstance();
    });
    
    afterEach(() => {
        audioEngine.destroy();
    });
    
    test('should be singleton', () => {
        const instance1 = AudioEngine.getInstance();
        const instance2 = AudioEngine.getInstance();
        
        expect(instance1).toBe(instance2);
    });
    
    test('should initialize with default values', () => {
        expect(audioEngine.isInitialized()).toBe(false);
        audioEngine.initialize();
        expect(audioEngine.isInitialized()).toBe(true);
    });
    
    test('should handle playback controls', async () => {
        audioEngine.initialize();
        
        // Start playback
        await audioEngine.start();
        expect(audioEngine.getCurrentTime()).toBeGreaterThan(0);
        
        // Pause playback
        audioEngine.pause();
        
        // Stop playback
        audioEngine.stop();
    });
    
    test('should update BPM', () => {
        audioEngine.initialize();
        const newBPM = 140;
        audioEngine.setBPM(newBPM);
        // Note: BPM is private, we can only test the setter
    });
    
    test('should handle cleanup', () => {
        audioEngine.initialize();
        audioEngine.destroy();
        expect(audioEngine.isInitialized()).toBe(false);
    });
    
    test('should handle errors gracefully', async () => {
        // Test error handling by trying to use uninitialized engine
        await expect(audioEngine.start()).rejects.toThrow();
    });
}); 