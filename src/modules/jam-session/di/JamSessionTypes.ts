/**
 * JamSession 模組的依賴注入類型
 */
export const JamSessionTypes = {
  // Repositories
  SessionRepository: Symbol.for('SessionRepository'),
  RoundRepository: Symbol.for('RoundRepository'),
  
  // Services
  JamSessionService: Symbol.for('JamSessionService'),
  CountdownService: Symbol.for('CountdownService'),
  RoleRegistry: Symbol.for('RoleRegistry'),
  JamSessionApplicationService: Symbol.for('JamSessionApplicationService'),
  RoundService: Symbol.for('RoundService'),
  
  // Event Bus
  JamEventBus: Symbol.for('JamEventBus'),
  
  // Mediator
  Mediator: Symbol.for('JamSessionMediator'),
  
  // Command Handlers
  CreateJamSessionHandler: Symbol.for('CreateJamSessionHandler'),
  JoinJamSessionHandler: Symbol.for('JoinJamSessionHandler'),
  SetPlayerRoleHandler: Symbol.for('SetPlayerRoleHandler'),
  TogglePlayerReadyHandler: Symbol.for('TogglePlayerReadyHandler'),
  StartJamSessionHandler: Symbol.for('StartJamSessionHandler'),
  StartNextRoundHandler: Symbol.for('StartNextRoundHandler'),
  EndCurrentRoundHandler: Symbol.for('EndCurrentRoundHandler'),
  EndJamSessionHandler: Symbol.for('EndJamSessionHandler'),
  
  // Query Handlers
  GetSessionByIdHandler: Symbol.for('GetSessionByIdHandler'),
  GetCurrentSessionInRoomHandler: Symbol.for('GetCurrentSessionInRoomHandler'),
  
  // Value Objects
  SessionId: Symbol.for('SessionId'),
  RoleVO: Symbol.for('RoleVO'),
  RoundVO: Symbol.for('RoundVO'),
  
  // Infrastructure
  JamSignalHubAdapter: Symbol.for('JamSignalHubAdapter'),
  JamTimerScheduler: Symbol.for('JamTimerScheduler'),
  
  // Event Handlers
  SessionCreatedHandler: Symbol.for('SessionCreatedHandler'),
  PlayerJoinedHandler: Symbol.for('PlayerJoinedHandler'),
  PlayerLeftHandler: Symbol.for('PlayerLeftHandler'),
  PlayerRoleChangedHandler: Symbol.for('PlayerRoleChangedHandler'),
  PlayerReadyChangedHandler: Symbol.for('PlayerReadyChangedHandler'),
  SessionStartedHandler: Symbol.for('SessionStartedHandler'),
  RoundStartedHandler: Symbol.for('RoundStartedHandler'),
  RoundEndedHandler: Symbol.for('RoundEndedHandler'),
  SessionEndedHandler: Symbol.for('SessionEndedHandler'),
  RoomClosedHandler: Symbol.for('RoomClosedHandler'),
  
  // Mappers
  SessionDtoMapper: Symbol.for('SessionDtoMapper'),
  
  // New types from the code block
  PeerLeftRoomHandler: Symbol.for('PeerLeftRoomHandler'),
  
  // 協調器
  JamSessionCoordinator: Symbol.for('JamSessionCoordinator'),
  SessionCoordinator: Symbol.for('SessionCoordinator'),
  RoundCoordinator: Symbol.for('RoundCoordinator')
};

// 新增整合層相關類型
export const JamSessionIntegrationTypes = {
  // 整合事件處理器
  DomainEventTranslator: Symbol.for('DomainEventTranslator'),
  CollaborationEventHandler: Symbol.for('CollaborationEventHandler'),
  
  // 整合事件
  SessionStartedIntegrationEvent: Symbol.for('SessionStartedIntegrationEvent'),
  PlayerUnavailableIntegrationEvent: Symbol.for('PlayerUnavailableIntegrationEvent'),
  RoundStateChangedIntegrationEvent: Symbol.for('RoundStateChangedIntegrationEvent'),
  TrackCreatedIntegrationEvent: Symbol.for('TrackCreatedIntegrationEvent'),
}; 