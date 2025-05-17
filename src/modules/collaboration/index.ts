import { Container } from 'inversify';
import { CollaborationModule } from './di/CollaborationModule';
import { CollaborationTypes } from './di/CollaborationTypes';
import type { CollaborationService } from './application/services/CollaborationService';
import type { SignalingService } from './domain/interfaces/SignalingService';
import type { PeerConnectionManager } from './domain/interfaces/PeerConnectionManager';

/**
 * 初始化協作模組
 * @param container DI容器
 */
export function initializeCollaborationModule(container: Container): void {
  CollaborationModule.configure(container);
}

// 導出主要類型和接口
export { CollaborationTypes };
export type { CollaborationService, SignalingService, PeerConnectionManager }; 
