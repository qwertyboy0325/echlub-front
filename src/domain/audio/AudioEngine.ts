import { injectable, inject } from 'inversify';
import type { IAudioContext, IEventBus, IAudioEngine } from '../../core/di/types';
import { ErrorHandler } from '../../core/error/ErrorHandler';
import { TYPES } from '../../core/di/types';

/**
 * Audio Engine
 * Manages audio playback and processing
 */
@injectable()
export class AudioEngine implements IAudioEngine {
    private static instance: AudioEngine | null = null;
    private audioContext: IAudioContext | null = null;
    private masterGain: GainNode | null = null;
    private initialized = false;
    private bpm = 120;
    private currentTime = 0;
    private isPlaying = false;
    private _isPaused = false;
    private lastPlayTime = 0;
    private transportWorklet: AudioWorkletNode | null = null;
    
    constructor(
        @inject(TYPES.AudioContext) public readonly context: IAudioContext,
        @inject(TYPES.EventBus) public readonly eventBus: IEventBus
    ) {
        if (!this.context) {
            throw new Error('AudioContext is required');
        }
        this.audioContext = this.context;
    }
    
    public onInit(): void {
        if (!this.initialized) {
            this.initialize();
        }
    }
    
    public onDestroy(): void {
        if (this.masterGain) {
            this.masterGain.disconnect();
        }
        if (this.transportWorklet) {
            this.transportWorklet.disconnect();
        }
        if (this.audioContext) {
            this.audioContext.onDestroy();
        }
        this.initialized = false;
        AudioEngine.instance = null;
    }
    
    private initialize(): void {
        if (!this.audioContext) {
            throw new Error('AudioContext is required');
        }
        
        this.masterGain = this.audioContext.createGain();
        if (this.masterGain && this.audioContext) {
            this.masterGain.connect(this.audioContext.destination);
        }
        this.initialized = true;
        
        // 在測試環境中，我們不需要初始化 transport worklet
        if (process.env.NODE_ENV !== 'test') {
            this.initializeTransport();
        }
    }
    
    private async initializeTransport(): Promise<void> {
        if (!this.audioContext) {
            throw new Error('AudioContext is required');
        }
        
        try {
            await this.audioContext.audioWorklet.addModule('/src/domain/audio/worklets/transport.ts');
            if (this.audioContext && this.masterGain) {
                this.transportWorklet = new AudioWorkletNode(this.audioContext, 'transport-processor');
                this.transportWorklet.connect(this.masterGain);
            }
        } catch (error) {
            ErrorHandler.getInstance().handleError(error as Error);
        }
    }
    
    public async play(): Promise<void> {
        if (!this.initialized) {
            throw new Error('AudioEngine is not initialized');
        }
        
        if (!this.isPlaying) {
            this.isPlaying = true;
            this._isPaused = false;
            this.lastPlayTime = this.audioContext?.currentTime ?? 0;
            await this.audioContext?.resume();
        }
    }
    
    public stop(): void {
        if (!this.initialized) {
            throw new Error('AudioEngine is not initialized');
        }
        
        this.isPlaying = false;
        this._isPaused = false;
        this.currentTime = 0;
    }
    
    public pause(): void {
        if (!this.initialized) {
            throw new Error('AudioEngine is not initialized');
        }
        
        if (this.isPlaying) {
            this.isPlaying = false;
            this._isPaused = true;
        }
    }
    
    public isPaused(): boolean {
        return this._isPaused;
    }
    
    public getCurrentTime(): number {
        if (this.isPlaying && !this._isPaused) {
            const currentContextTime = this.audioContext?.currentTime ?? 0;
            return this.currentTime + (currentContextTime - this.lastPlayTime);
        }
        return this.currentTime;
    }
    
    public setBPM(bpm: number): void {
        if (!this.initialized) {
            throw new Error('AudioEngine is not initialized');
        }
        
        try {
            this.bpm = bpm;
            if (this.transportWorklet) {
                this.transportWorklet.port.postMessage({ type: 'setBPM', bpm });
            }
        } catch (error) {
            ErrorHandler.getInstance().handleError(error as Error);
        }
    }
    
    public getBPM(): number {
        return this.bpm;
    }
    
    public isInitialized(): boolean {
        return this.initialized;
    }
}
