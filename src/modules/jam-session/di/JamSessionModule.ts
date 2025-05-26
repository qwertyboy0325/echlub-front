import { Container } from 'inversify';
import { JamSessionTypes, JamSessionIntegrationTypes } from './JamSessionTypes';
import { SessionRepository } from '../domain/interfaces/SessionRepository';
import { InMemorySessionRepository } from '../infrastructure/repositories/InMemorySessionRepository';
import { CreateJamSessionHandler } from '../application/handlers/CreateJamSessionHandler';
import { JoinJamSessionHandler } from '../application/handlers/JoinJamSessionHandler';
import { SetPlayerRoleHandler } from '../application/handlers/SetPlayerRoleHandler';
import { TogglePlayerReadyHandler } from '../application/handlers/TogglePlayerReadyHandler';
import { StartJamSessionHandler } from '../application/handlers/StartJamSessionHandler';
import { StartNextRoundHandler } from '../application/handlers/StartNextRoundHandler';
import { EndCurrentRoundHandler } from '../application/handlers/EndCurrentRoundHandler';
import { EndJamSessionHandler } from '../application/handlers/EndJamSessionHandler';
import { JamEventBus } from '../infrastructure/messaging/JamEventBus';
import { JamSignalHubAdapter } from '../infrastructure/adapters/JamSignalHubAdapter';
import { JamTimerScheduler } from '../infrastructure/timing/JamTimerScheduler';
import { PeerLeftRoomHandler } from '../application/event-handlers/PeerLeftRoomHandler';
import { RoomClosedHandler } from '../application/event-handlers/RoomClosedHandler';
import { CountdownService } from '../application/services/CountdownService';
import { RoleRegistry } from '../application/services/RoleRegistry';
import { PlayerRoleChangedHandler } from '../application/event-handlers/PlayerRoleChangedHandler';
import { SessionStartedHandler } from '../application/event-handlers/SessionStartedHandler';
import { RoundStartedHandler } from '../application/event-handlers/RoundStartedHandler';
import { DomainEventTranslator } from '../integration/services/DomainEventTranslator';
import { CollaborationEventHandler } from '../integration/handlers/CollaborationEventHandler';
import { JamSessionApplicationService } from '../application/services/JamSessionApplicationService';

/**
 * JamSession 模組配置
 */
export class JamSessionModule {
  /**
   * 配置 JamSession 模組的依賴注入
   * @param container DI 容器
   */
  public static configure(container: Container): void {
    // Repositories
    container.bind<SessionRepository>(JamSessionTypes.SessionRepository)
      .to(InMemorySessionRepository)
      .inSingletonScope();
    
    
    container.bind<CountdownService>(JamSessionTypes.CountdownService)
      .to(CountdownService)
      .inSingletonScope();
    
    // Command Handlers
    container.bind<CreateJamSessionHandler>(JamSessionTypes.CreateJamSessionHandler)
      .to(CreateJamSessionHandler)
      .inSingletonScope();
    
    container.bind<JoinJamSessionHandler>(JamSessionTypes.JoinJamSessionHandler)
      .to(JoinJamSessionHandler)
      .inSingletonScope();
    
    container.bind<SetPlayerRoleHandler>(JamSessionTypes.SetPlayerRoleHandler)
      .to(SetPlayerRoleHandler)
      .inSingletonScope();
    
    container.bind<TogglePlayerReadyHandler>(JamSessionTypes.TogglePlayerReadyHandler)
      .to(TogglePlayerReadyHandler)
      .inSingletonScope();
    
    container.bind<StartJamSessionHandler>(JamSessionTypes.StartJamSessionHandler)
      .to(StartJamSessionHandler)
      .inSingletonScope();
    
    container.bind<StartNextRoundHandler>(JamSessionTypes.StartNextRoundHandler)
      .to(StartNextRoundHandler)
      .inSingletonScope();
    
    container.bind<EndCurrentRoundHandler>(JamSessionTypes.EndCurrentRoundHandler)
      .to(EndCurrentRoundHandler)
      .inSingletonScope();
    
    container.bind<EndJamSessionHandler>(JamSessionTypes.EndJamSessionHandler)
      .to(EndJamSessionHandler)
      .inSingletonScope();
    
    // Infrastructure
    container.bind<JamEventBus>(JamSessionTypes.JamEventBus)
      .to(JamEventBus)
      .inSingletonScope();
    
    container.bind<JamSignalHubAdapter>(JamSessionTypes.JamSignalHubAdapter)
      .to(JamSignalHubAdapter)
      .inSingletonScope();
    
    container.bind<JamTimerScheduler>(JamSessionTypes.JamTimerScheduler)
      .to(JamTimerScheduler)
      .inSingletonScope();
    
    // Event Handlers
    container.bind<PeerLeftRoomHandler>(JamSessionTypes.PeerLeftRoomHandler)
      .to(PeerLeftRoomHandler)
      .inSingletonScope();
    
    container.bind<RoomClosedHandler>(JamSessionTypes.RoomClosedHandler)
      .to(RoomClosedHandler)
      .inSingletonScope();
    
    container.bind<PlayerRoleChangedHandler>(JamSessionTypes.PlayerRoleChangedHandler)
      .to(PlayerRoleChangedHandler)
      .inSingletonScope();
    
    container.bind<SessionStartedHandler>(JamSessionTypes.SessionStartedHandler)
      .to(SessionStartedHandler)
      .inSingletonScope();
    
    container.bind<RoundStartedHandler>(JamSessionTypes.RoundStartedHandler)
      .to(RoundStartedHandler)
      .inSingletonScope();
    
    // Services
    container.bind<RoleRegistry>(JamSessionTypes.RoleRegistry)
      .to(RoleRegistry)
      .inSingletonScope();
    
    // Integration Layer 註冊
    container.bind<DomainEventTranslator>(JamSessionIntegrationTypes.DomainEventTranslator)
      .to(DomainEventTranslator)
      .inSingletonScope()
      .onActivation((context, service) => {
        console.log('DomainEventTranslator activated');
        return service;
      });
    
    container.bind<CollaborationEventHandler>(JamSessionIntegrationTypes.CollaborationEventHandler)
      .to(CollaborationEventHandler)
      .inSingletonScope()
      .onActivation((context, service) => {
        console.log('CollaborationEventHandler activated');
        return service;
      });
    
    container.bind<JamSessionApplicationService>(JamSessionTypes.JamSessionApplicationService)
      .to(JamSessionApplicationService)
      .inSingletonScope();
    
    // Setup event subscriptions
    const eventBus = container.get<JamEventBus>(JamSessionTypes.JamEventBus);
    const peerLeftRoomHandler = container.get<PeerLeftRoomHandler>(JamSessionTypes.PeerLeftRoomHandler);
    const roomClosedHandler = container.get<RoomClosedHandler>(JamSessionTypes.RoomClosedHandler);
    const playerRoleChangedHandler = container.get<PlayerRoleChangedHandler>(JamSessionTypes.PlayerRoleChangedHandler);
    const sessionStartedHandler = container.get<SessionStartedHandler>(JamSessionTypes.SessionStartedHandler);
    const roundStartedHandler = container.get<RoundStartedHandler>(JamSessionTypes.RoundStartedHandler);
    
    // Subscribe to Collaboration events
    eventBus.subscribe('collab.peer-left-room', (event) => peerLeftRoomHandler.handle(event));
    eventBus.subscribe('collab.room-closed', (event) => roomClosedHandler.handle(event));
    
    // Subscribe to Domain events
    eventBus.subscribe('jam.player-role-set', (event) => playerRoleChangedHandler.handle(event));
    eventBus.subscribe('jam.session-started', (event) => sessionStartedHandler.handle(event));
    eventBus.subscribe('jam.round-started', (event) => roundStartedHandler.handle(event));
  }
} 