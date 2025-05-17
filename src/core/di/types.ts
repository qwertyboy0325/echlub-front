/**
 * 核心依賴注入類型
 */
export const TYPES = {
  // 倉儲
  TrackRepository: Symbol.for('TrackRepository'),
  ClipRepository: Symbol.for('ClipRepository'),
  PluginRepository: Symbol.for('PluginRepository'),

  // 服務
  TrackService: Symbol.for('TrackService'),
  ClipService: Symbol.for('ClipService'),
  PluginService: Symbol.for('PluginService'),
  TrackStateService: Symbol.for('TrackStateService'),

  // 核心服務
  EventBus: Symbol.for('EventBus'),
  StateManager: Symbol.for('StateManager'),
  Logger: Symbol.for('Logger'),
  EventMonitor: Symbol.for('EventMonitor'),
  DAWManager: Symbol.for('DAWManager'),

  // 客戶端
  WebSocketClient: Symbol.for('WebSocketClient'),
  WebRTCClient: Symbol.for('WebRTCClient'),

  // General
  ENV_CONFIG: Symbol.for('ENV_CONFIG'), // Environment configuration for adapters and services

  // 配置
  Configuration: Symbol.for('Configuration'),
  
  // 儲存
  Storage: Symbol.for('Storage'),
  
  // API客戶端
  ApiClient: Symbol.for('ApiClient'),
  
  // 缓存
  Cache: Symbol.for('Cache')
} as const; 
