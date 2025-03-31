import { Container } from "inversify";

// 定義 Token
export const TYPES = {
    // Core Services
    DAWManager: Symbol.for('DAWManager'),
    EventBus: Symbol.for('EventBus'),
    
    // Audio Services
    AudioContext: Symbol.for('AudioContext'),
    AudioEngine: Symbol.for('AudioEngine'),
    
    // Repositories
    ClipRepository: Symbol.for('ClipRepository'),
    TrackRepository: Symbol.for('TrackRepository'),
    ProjectRepository: Symbol.for('ProjectRepository'),
    AudioRepository: Symbol.for('AudioRepository'),
    
    // Storage
    Storage: Symbol.for('Storage'),
    
    // State Management
    StateManager: Symbol.for('StateManager'),
    
    // UI Services
    ThemeService: Symbol.for('ThemeService'),
    LayoutService: Symbol.for('LayoutService'),
    
    // Presenters
    DAWPresenter: Symbol.for('DAWPresenter')
};

// 定義介面
export interface IAudioContext extends BaseAudioContext {
    onInit(): void;
    onDestroy(): void;
    getContext(): AudioContext | null;
    resume(): Promise<void>;
    suspend(): Promise<void>;
    close(): Promise<void>;
}

export interface IEventBus {
    onInit(): void;
    onDestroy(): void;
    emit(type: string, payload: any, priority?: number): void;
    subscribe(type: string, handler: (event: any) => void, priority?: number): void;
    unsubscribe(type: string, handler: (event: any) => void): void;
}

export interface IAudioEngine {
    onInit(): void;
    onDestroy(): void;
    context: IAudioContext;
    eventBus: IEventBus;
    play(): void;
    pause(): void;
    stop(): void;
    isPaused(): boolean;
    getCurrentTime(): number;
    setBPM(bpm: number): void;
    getBPM(): number;
} 