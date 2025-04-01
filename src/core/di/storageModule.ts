import { ContainerModule } from 'inversify';
import { TYPES } from './types';
import { LocalStorageService } from '../storage/LocalStorageService';
import { StateManager } from '../state/StateManager';

export const storageModule = new ContainerModule((bind) => {
  // 綁定存儲服務
  bind<LocalStorageService>(TYPES.Storage)
    .to(LocalStorageService)
    .inSingletonScope();

  // 綁定狀態管理器
  bind<StateManager>(TYPES.StateManager)
    .to(StateManager)
    .inSingletonScope();
}); 