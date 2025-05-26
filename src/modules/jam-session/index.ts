import { Container } from 'inversify';
import { JamSessionModule } from './di/JamSessionModule';
import { JamSessionTypes } from './di/JamSessionTypes';
import type { JamSessionService } from './application/services/JamSessionService';
import type { SessionRepository } from './domain/interfaces/SessionRepository';
import type { SessionId } from './domain/value-objects/SessionId';
import type { RoleVO } from './domain/value-objects/RoleVO';
import type { RoundVO } from './domain/value-objects/RoundVO';

/**
 * 初始化 JamSession 模組
 * @param container DI 容器
 */
export function initializeJamSessionModule(container: Container): void {
  JamSessionModule.configure(container);
}

// 導出主要類型和接口
export { JamSessionTypes };
export type { 
  JamSessionService, 
  SessionRepository, 
  SessionId, 
  RoleVO, 
  RoundVO 
}; 