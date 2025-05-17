import { Container } from 'inversify';
import { CollaborationTypes } from './CollaborationTypes';

// Repositories
import { InMemoryRoomRepository } from '../infrastructure/repositories/InMemoryRoomRepository';
import type { IRoomRepository } from '../domain/repositories/IRoomRepository';

// Adapters
import { WebRTCAdapter } from '../infrastructure/adapters/WebRTCAdapter';
import { SignalHubAdapter } from '../infrastructure/adapters/SignalHubAdapter';
import { LocalCacheAdapter } from '../infrastructure/adapters/LocalCacheAdapter';
import { CollaborationApiAdapter } from '../infrastructure/adapters/CollaborationApiAdapter';
import type { IWebRTCAdapter } from '../infrastructure/adapters/IWebRTCAdapter';
import type { ISignalHubAdapter } from '../infrastructure/adapters/ISignalHubAdapter';
import type { ILocalCacheAdapter } from '../infrastructure/adapters/ILocalCacheAdapter';
import type { ICollaborationApiAdapter } from '../infrastructure/adapters/ICollaborationApiAdapter';

// Command Handlers
import { CreateRoomCommandHandler } from '../application/handlers/CreateRoomCommandHandler';
import { JoinRoomCommandHandler } from '../application/handlers/JoinRoomCommandHandler';
import { LeaveRoomCommandHandler } from '../application/handlers/LeaveRoomCommandHandler';
import { UpdateRoomRulesCommandHandler } from '../application/handlers/UpdateRoomRulesCommandHandler';
import { CloseRoomCommandHandler } from '../application/handlers/CloseRoomCommandHandler';

// Services
import type { CollaborationService } from '../application/services/CollaborationService';
import { CollaborationServiceImplementation } from '../application/services/CollaborationServiceImplementation';

// WebRTC & Signaling
import type { SignalingService } from '../domain/interfaces/SignalingService';
import { WebSocketSignalingService } from '../infrastructure/WebSocketSignalingService';
import type { PeerConnectionManager } from '../domain/interfaces/PeerConnectionManager';
import { WebRTCPeerConnectionManager } from '../infrastructure/WebRTCPeerConnectionManager';

/**
 * 配置 Collaboration 模塊的依賴注入容器
 */
export const configureCollaborationContainer = (container: Container): void => {
  // 註冊倉儲
  container.bind<IRoomRepository>(CollaborationTypes.RoomRepository)
    .to(InMemoryRoomRepository)
    .inSingletonScope();
  
  // 註冊適配器
  container.bind<IWebRTCAdapter>(CollaborationTypes.WebRTCAdapter)
    .to(WebRTCAdapter)
    .inSingletonScope();
  
  container.bind<ISignalHubAdapter>(CollaborationTypes.SignalHubAdapter)
    .to(SignalHubAdapter)
    .inSingletonScope();
  
  container.bind<ILocalCacheAdapter>(CollaborationTypes.LocalCacheAdapter)
    .to(LocalCacheAdapter)
    .inSingletonScope();
  
  container.bind<ICollaborationApiAdapter>(CollaborationTypes.CollaborationApiAdapter)
    .to(CollaborationApiAdapter)
    .inSingletonScope();
  
  // 註冊 WebRTC 和信令服務
  container.bind<SignalingService>(CollaborationTypes.SignalingService)
    .to(WebSocketSignalingService)
    .inSingletonScope();
    
  container.bind<PeerConnectionManager>(CollaborationTypes.PeerConnectionManager)
    .to(WebRTCPeerConnectionManager)
    .inSingletonScope();
  
  // 註冊服務
  container.bind<CollaborationService>(CollaborationTypes.CollaborationService)
    .to(CollaborationServiceImplementation)
    .inSingletonScope();
  
  // 註冊命令處理器
  container.bind(CollaborationTypes.CreateRoomCommandHandler)
    .to(CreateRoomCommandHandler)
    .inTransientScope();
  
  container.bind(CollaborationTypes.JoinRoomCommandHandler)
    .to(JoinRoomCommandHandler)
    .inTransientScope();
  
  container.bind(CollaborationTypes.LeaveRoomCommandHandler)
    .to(LeaveRoomCommandHandler)
    .inTransientScope();
  
  container.bind(CollaborationTypes.UpdateRoomRulesCommandHandler)
    .to(UpdateRoomRulesCommandHandler)
    .inTransientScope();
  
  container.bind(CollaborationTypes.CloseRoomCommandHandler)
    .to(CloseRoomCommandHandler)
    .inTransientScope();
}; 
