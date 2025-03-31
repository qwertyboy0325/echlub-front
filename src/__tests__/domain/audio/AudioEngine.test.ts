import { Container } from 'inversify';
import { TYPES } from '../../../core/di/types';
import type { IAudioEngine } from '../../../core/di/types';
import { registerServices } from '../../../core/di/container';

describe('AudioEngine', () => {
    let container: Container;
    let audioEngine: IAudioEngine;
    
    beforeEach(() => {
        container = new Container();
        registerServices(container);
        audioEngine = container.get<IAudioEngine>(TYPES.AudioEngine);
    });
    
    afterEach(() => {
        container.unbindAll();
    });
    
    it('should be singleton', () => {
        const instance1 = container.get<IAudioEngine>(TYPES.AudioEngine);
        const instance2 = container.get<IAudioEngine>(TYPES.AudioEngine);
        
        expect(instance1).toBe(instance2);
    });
    
    it('should initialize with default values', () => {
        audioEngine.onInit();
        expect(audioEngine.context).toBeDefined();
        expect(audioEngine.eventBus).toBeDefined();
    });
    
    it('should handle playback controls', () => {
        audioEngine.onInit();
        audioEngine.play();
        expect(audioEngine.getCurrentTime()).toBeGreaterThanOrEqual(0);
        audioEngine.pause();
        expect(audioEngine.isPaused()).toBe(true);
        audioEngine.stop();
        expect(audioEngine.getCurrentTime()).toBe(0);
    });
    
    it('should update BPM', () => {
        audioEngine.onInit();
        audioEngine.setBPM(120);
        expect(audioEngine.getBPM()).toBe(120);
    });
    
    it('should handle cleanup', () => {
        audioEngine.onInit();
        audioEngine.onDestroy();
        expect(() => audioEngine.play()).toThrow();
    });
    
    it('should handle errors gracefully', async () => {
        await expect(audioEngine.play()).rejects.toThrow('AudioEngine is not initialized');
    });
}); 

// Mock CustomAudioContext
const mockCustomAudioContext = Object.create(
    {},
    {
        onInit: { value: jest.fn(), writable: true },
        onDestroy: { value: jest.fn(), writable: true },
        getContext: { value: jest.fn().mockReturnValue(null), writable: true },
        resume: { value: jest.fn().mockResolvedValue(undefined), writable: true },
        suspend: { value: jest.fn().mockResolvedValue(undefined), writable: true },
        close: { value: jest.fn().mockResolvedValue(undefined), writable: true },
        createAnalyser: { value: jest.fn(), writable: true },
        createBiquadFilter: { value: jest.fn(), writable: true },
        createBuffer: { value: jest.fn(), writable: true },
        createBufferSource: { value: jest.fn(), writable: true },
    }
) as AudioContext;

// Mock AudioDestinationNode
const mockDestinationNode = Object.create(
    {},
    {
        maxChannelCount: { value: 2, writable: true },
        channelCount: { value: 2, writable: true },
        channelCountMode: { value: 'max' as ChannelCountMode, writable: true },
        channelInterpretation: { value: 'speakers' as ChannelInterpretation, writable: true },
        numberOfInputs: { value: 1, writable: true },
        numberOfOutputs: { value: 0, writable: true },
        connect: { 
            value: jest.fn().mockImplementation((destination: AudioNode) => destination), 
            writable: true 
        },
        disconnect: { 
            value: jest.fn().mockImplementation(() => {}), 
            writable: true 
        },
        addEventListener: { 
            value: jest.fn().mockImplementation((type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) => {}), 
            writable: true 
        },
        removeEventListener: { 
            value: jest.fn().mockImplementation((type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions) => {}), 
            writable: true 
        },
        dispatchEvent: { 
            value: jest.fn().mockImplementation((event: Event) => true), 
            writable: true 
        },
        onended: { 
            value: null, 
            writable: true 
        },
        context: { 
            value: mockCustomAudioContext, 
            writable: false 
        }
    }
) as AudioDestinationNode;