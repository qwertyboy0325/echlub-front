import { Container, ContainerModule } from 'inversify';
import { CollaborationTypes } from './CollaborationTypes';
import type { SignalingService } from '../domain/interfaces/SignalingService';
import { WebSocketSignalingService } from '../infrastructure/WebSocketSignalingService';
import type { PeerConnectionManager } from '../domain/interfaces/PeerConnectionManager';
import { WebRTCPeerConnectionManager } from '../infrastructure/WebRTCPeerConnectionManager';
import type { CollaborationService } from '../application/services/CollaborationService';
import { CollaborationServiceImplementation } from '../application/services/CollaborationServiceImplementation';

/**
 * 協作模組的依賴注入模組
 * 注册所有相關服務到IoC容器
 */
export class CollaborationModule extends ContainerModule {
  constructor() {
    super((bind) => {
      // 服務绑定
      bind<CollaborationService>(CollaborationTypes.CollaborationService)
        .to(CollaborationServiceImplementation)
        .inSingletonScope();

      // WebRTC與信令相關
      bind<SignalingService>(CollaborationTypes.SignalingService)
        .to(WebSocketSignalingService)
        .inSingletonScope();
        
      bind<PeerConnectionManager>(CollaborationTypes.PeerConnectionManager)
        .to(WebRTCPeerConnectionManager)
        .inSingletonScope();
        
      // 這裡可以繼續註冊其他協作模組所需的依賴...
    });
  }
  
  /**
   * 快速配置方法
   * @param container IoC容器
   */
  public static configure(container: Container): void {
    if (!container.isBound(CollaborationTypes.CollaborationService)) {
      container.load(new CollaborationModule());
    }
  }
} 
