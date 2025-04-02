import { Container } from "inversify";

// 定義 Token
export const TYPES = {
    // Core Services
    DAWManager: Symbol.for('DAWManager'),
    EventBus: Symbol.for('EventBus'),
    UIEventBus: Symbol.for('UIEventBus'),
    
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
    DAWPresenter: Symbol.for('DAWPresenter'),
    TrackPresenter: Symbol.for('TrackPresenter'),

    // 事件系統相關
    DomainEventBus: Symbol.for('DomainEventBus'),
    EventTranslator: Symbol.for('EventTranslator'),

    // 圖形系統
    RenderEngine: Symbol.for('RenderEngine'),
    DragSystem: Symbol.for('DragSystem'),
    DAWScene: Symbol.for('DAWScene'),

    EventMonitor: Symbol.for('EventMonitor'),

    // Graphics
    DAWRenderer: Symbol.for('DAWRenderer'),

    PerformanceMonitor: Symbol.for('PerformanceMonitor'),
} as const;

// 定義介面
export interface IAudioContext {
    onInit(): Promise<void>;
    onDestroy(): Promise<void>;
    getContext(): AudioContext | null;
    resume(): Promise<void>;
    suspend(): Promise<void>;
    close(): Promise<void>;
    readonly currentTime: number;
    readonly sampleRate: number;
    readonly state: AudioContextState;
    decodeAudioData(arrayBuffer: ArrayBuffer): Promise<AudioBuffer>;
    createGain(): GainNode;
    createOscillator(): OscillatorNode;
    createBufferSource(): AudioBufferSourceNode;
}

export interface IEventBus {
    onInit(): void;
    onDestroy(): void;
    emit(type: string, payload: any, priority?: number): void;
    subscribe(type: string, handler: (event: any) => void, priority?: number): void;
    unsubscribe(type: string, handler: (event: any) => void): void;
}

export interface IAudioEngine {
    context: IAudioContext;
    onInit(): Promise<void>;
    onDestroy(): Promise<void>;
    play(): void;
    pause(): void;
    stop(): void;
    isPaused(): boolean;
    getCurrentTime(): number;
    setBPM(bpm: number): void;
    getBPM(): number;
    loadAudio(file: File): Promise<string>;
} 