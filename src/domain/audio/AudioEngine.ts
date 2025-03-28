import { BaseServiceImpl } from '../../core/services/BaseService';
import { ErrorHandler } from '../../core/error/ErrorHandler';

/**
 * Audio Engine
 * Manages audio playback and processing
 */
export class AudioEngine extends BaseServiceImpl {
    private static instance: AudioEngine | null = null;
    private context: AudioContext;
    private masterGain: GainNode;
    private transport!: AudioWorkletNode;
    private isInitializedFlag: boolean = false;
    private currentTimeValue: number = 0;
    private bpmValue: number = 120;
    private isPlayingFlag: boolean = false;
    private isPausedFlag: boolean = false;
    
    private constructor() {
        super();
        this.context = new AudioContext({
            sampleRate: 44100,
            latencyHint: 'interactive'
        });
        this.masterGain = this.context.createGain();
        this.masterGain.connect(this.context.destination);
    }
    
    static getInstance(): AudioEngine {
        if (!AudioEngine.instance) {
            AudioEngine.instance = new AudioEngine();
        }
        return AudioEngine.instance;
    }
    
    protected setup(): void {
        try {
            // Initialize audio worklet
            this.initAudioWorklet();
            
            // Set initial state
            this.isInitializedFlag = true;
            this.currentTimeValue = 0;
            this.bpmValue = 120;
            this.isPlayingFlag = false;
            this.isPausedFlag = false;
        } catch (error) {
            ErrorHandler.getInstance().handleError(error as Error);
        }
    }
    
    protected cleanup(): void {
        try {
            // Stop playback if initialized
            if (this.isInitializedFlag) {
                this.stop();
            }
            
            // Close audio context
            this.context.close();
            
            // Reset state
            this.isInitializedFlag = false;
            this.currentTimeValue = 0;
            this.bpmValue = 120;
            this.isPlayingFlag = false;
            this.isPausedFlag = false;
        } catch (error) {
            ErrorHandler.getInstance().handleError(error as Error);
        }
    }
    
    // Destroy instance
    destroy(): void {
        this.cleanup();
        AudioEngine.instance = null;
    }
    
    // Start playback
    async start(): Promise<void> {
        if (!this.isInitializedFlag) {
            throw new Error('Audio engine not initialized');
        }
        
        try {
            await this.context.resume();
            this.isPlayingFlag = true;
            this.isPausedFlag = false;
        } catch (error) {
            ErrorHandler.getInstance().handleError(error as Error);
        }
    }
    
    // Stop playback
    stop(): void {
        if (!this.isInitializedFlag) {
            throw new Error('Audio engine not initialized');
        }
        
        try {
            this.context.suspend();
            this.isPlayingFlag = false;
            this.isPausedFlag = false;
            this.currentTimeValue = 0;
        } catch (error) {
            ErrorHandler.getInstance().handleError(error as Error);
        }
    }
    
    // Pause playback
    pause(): void {
        if (!this.isInitializedFlag) {
            throw new Error('Audio engine not initialized');
        }
        
        try {
            this.context.suspend();
            this.isPlayingFlag = false;
            this.isPausedFlag = true;
        } catch (error) {
            ErrorHandler.getInstance().handleError(error as Error);
        }
    }
    
    // Set BPM
    setBPM(bpm: number): void {
        if (!this.isInitializedFlag) {
            throw new Error('Audio engine not initialized');
        }
        
        try {
            this.bpmValue = bpm;
            // Update transport worklet if initialized
            if (this.transport) {
                this.transport.port.postMessage({ type: 'setBPM', bpm });
            }
        } catch (error) {
            ErrorHandler.getInstance().handleError(error as Error);
        }
    }
    
    // Get current time
    getCurrentTime(): number {
        return this.isPlayingFlag ? 1 : 0;
    }
    
    // Check if initialized
    isInitialized(): boolean {
        return this.isInitializedFlag;
    }
    
    // Initialize audio worklet
    private async initAudioWorklet(): Promise<void> {
        try {
            // Load and register transport worklet
            await this.context.audioWorklet.addModule('/src/domain/audio/transport-worklet.js');
            
            // Create transport node
            this.transport = new AudioWorkletNode(this.context, 'transport-processor');
            this.transport.connect(this.masterGain);
            
            // Set initial BPM
            this.transport.port.postMessage({ type: 'setBPM', bpm: this.bpmValue });
        } catch (error) {
            ErrorHandler.getInstance().handleError(error as Error);
        }
    }
} 