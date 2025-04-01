import { Container } from 'inversify';
import { eventModule } from './eventModule';
import { audioModule } from './audioModule';
import { storageModule } from './storageModule';
import { dawModule } from './dawModule';
import { TYPES } from './types';
import 'reflect-metadata';
import type { ClipRepository } from '../../domain/repositories/ClipRepository';
import type { TrackRepository } from '../../domain/repositories/TrackRepository';
import type { ProjectRepository } from '../../domain/repositories/ProjectRepository';
import type { AudioRepository } from '../../domain/repositories/AudioRepository';
import type { Storage } from '../../infrastructure/storage/Storage';
import type { IAudioContext } from './types';
import type { IAudioEngine } from './types';
import type { IEventBus } from './types';
import { LocalStorageService } from '../storage/LocalStorageService';
import { AudioContextWrapper } from '../audio/AudioContextWrapper';
import { AudioEngine } from '../audio/AudioEngine';
import { EventBus } from '../events/EventBus';
import { DAWPresenter } from '../../presentation/presenters/DAWPresenter';
import { DAWManager } from '../DAWManager';

// 創建 DI 容器
const container = new Container({
  defaultScope: 'Singleton',
  autoBindInjectable: true
});

// 加載所有模塊
container.load(
  eventModule,   // 事件系統模塊
  dawModule,     // DAW 相關模塊
  audioModule,   // 音頻處理模塊
  storageModule  // 存儲模塊
);

export { container, TYPES };

export function registerServices(container: Container): void {
  // Register Storage
  container.bind<Storage>(TYPES.Storage)
    .to(LocalStorageService)
    .inSingletonScope();

  // Register Core Services
  container.bind<DAWManager>(TYPES.DAWManager)
    .to(DAWManager)
    .inSingletonScope();

  container.bind<IEventBus>(TYPES.EventBus)
    .to(EventBus)
    .inSingletonScope();

  // Register Audio Services
  container.bind<IAudioContext>(TYPES.AudioContext)
    .to(AudioContextWrapper)
    .inSingletonScope();

  container.bind<IAudioEngine>(TYPES.AudioEngine)
    .to(AudioEngine)
    .inSingletonScope();

  // Register Presenters
  container.bind<DAWPresenter>(TYPES.DAWPresenter)
    .to(DAWPresenter)
    .inSingletonScope();
} 