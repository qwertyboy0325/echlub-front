// Core Services
export const TYPES = {
    // Event System
    EventBus: Symbol.for('EventBus'),
    EventQueue: Symbol.for('EventQueue'),
    EventStateSync: Symbol.for('EventStateSync'),
    EventStateOptimizer: Symbol.for('EventStateOptimizer'),
    EventStateErrorHandler: Symbol.for('EventStateErrorHandler'),

    // State Management
    StateManager: Symbol.for('StateManager'),
    StateStore: Symbol.for('StateStore'),
    StorageService: Symbol.for('StorageService'),

    // Audio Engine
    AudioEngine: Symbol.for('AudioEngine'),
    AudioProcessor: Symbol.for('AudioProcessor'),
    AudioScheduler: Symbol.for('AudioScheduler'),

    // Pixi
    PixiManager: Symbol.for('PixiManager'),
    PixiRenderer: Symbol.for('PixiRenderer'),
    PixiLayerManager: Symbol.for('PixiLayerManager'),

    // Infrastructure
    Logger: Symbol.for('Logger'),
    ConfigService: Symbol.for('ConfigService'),
    ApiClient: Symbol.for('ApiClient'),

    // Features
    TrackService: Symbol.for('TrackService'),
    ClipService: Symbol.for('ClipService'),
    ProjectService: Symbol.for('ProjectService'),
    TransportService: Symbol.for('TransportService'),

    // Repositories
    ProjectRepository: Symbol.for('ProjectRepository'),
    TrackRepository: Symbol.for('TrackRepository'),
    ClipRepository: Symbol.for('ClipRepository'),
    UserRepository: Symbol.for('UserRepository')
} as const; 