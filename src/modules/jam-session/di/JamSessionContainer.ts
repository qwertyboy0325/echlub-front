import { Container } from 'inversify';
import { SessionCoordinator, RoundCoordinator } from '../application/coordinators';
import { JamSessionTypes } from './JamSessionTypes';

// 處理器
import { StartJamSessionHandler } from '../application/handlers/StartJamSessionHandler';
import { TogglePlayerReadyHandler } from '../application/handlers/TogglePlayerReadyHandler';
import { StartNextRoundHandler } from '../application/handlers/StartNextRoundHandler';
import { EndCurrentRoundHandler } from '../application/handlers/EndCurrentRoundHandler';
import { SetPlayerRoleHandler } from '../application/handlers/SetPlayerRoleHandler';

// 事件處理器
import { PeerLeftRoomHandler } from '../application/event-handlers/PeerLeftRoomHandler';
import { RoomClosedHandler } from '../application/event-handlers/RoomClosedHandler';

// 倉儲
import { SessionRepository } from '../domain/interfaces/SessionRepository';
import { RoundRepository } from '../domain/interfaces/RoundRepository';

// 服務
import { JamSessionApplicationService } from '../application/services/JamSessionApplicationService';
import { IJamEventBus } from '../domain/interfaces/IJamEventBus';

/**
 * 創建 Jam Session 模組的 DI 容器
 */
export function createJamSessionContainer(): Container {
  const container = new Container();
  
  // 註冊倉儲 - 實際實現在應用初始化時綁定
  container.bind(JamSessionTypes.SessionRepository).toConstantValue({} as SessionRepository);
  container.bind(JamSessionTypes.RoundRepository).toConstantValue({} as RoundRepository);
  
  // 註冊協調器
  container.bind<SessionCoordinator>(JamSessionTypes.SessionCoordinator).to(SessionCoordinator).inSingletonScope();
  container.bind<RoundCoordinator>(JamSessionTypes.RoundCoordinator).to(RoundCoordinator).inSingletonScope();
  
  // 註冊命令處理器
  container.bind<StartJamSessionHandler>(JamSessionTypes.StartJamSessionHandler).to(StartJamSessionHandler);
  container.bind<TogglePlayerReadyHandler>(JamSessionTypes.TogglePlayerReadyHandler).to(TogglePlayerReadyHandler);
  container.bind<StartNextRoundHandler>(JamSessionTypes.StartNextRoundHandler).to(StartNextRoundHandler);
  container.bind<EndCurrentRoundHandler>(JamSessionTypes.EndCurrentRoundHandler).to(EndCurrentRoundHandler);
  container.bind<SetPlayerRoleHandler>(JamSessionTypes.SetPlayerRoleHandler).to(SetPlayerRoleHandler);
  
  // 註冊事件處理器
  container.bind<PeerLeftRoomHandler>(JamSessionTypes.PeerLeftRoomHandler).to(PeerLeftRoomHandler);
  container.bind<RoomClosedHandler>(JamSessionTypes.RoomClosedHandler).to(RoomClosedHandler);
  
  // 註冊應用服務
  container.bind<JamSessionApplicationService>(JamSessionTypes.JamSessionApplicationService)
    .to(JamSessionApplicationService).inSingletonScope();
  
  // 註冊事件匯流排 - 實際實現在應用初始化時綁定
  container.bind<IJamEventBus>(JamSessionTypes.JamEventBus).toConstantValue({} as IJamEventBus);
  
  return container;
} 