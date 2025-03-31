import { Container } from 'inversify';
import { TYPES } from './types';
import type { ClipRepository } from '../../domain/repositories/ClipRepository';
import { ClipRepositoryImpl } from '../../data/repositories/ClipRepositoryImpl';
import { DAWManager } from '../DAWManager';
import { CustomAudioContext } from '../../domain/audio/AudioContext';
import { AudioEngine } from '../../domain/audio/AudioEngine';
import { EventBus } from '../events/EventBus';
import type { IAudioContext } from './types';
import type { IAudioEngine } from './types';
import type { IEventBus } from './types';
import type { Storage } from '../../infrastructure/storage/Storage';
import { LocalStorage } from '../../infrastructure/storage/LocalStorage';
import type { TrackRepository } from '../../domain/repositories/TrackRepository';
import { TrackRepositoryImpl } from '../../data/repositories/TrackRepositoryImpl';
import type { ProjectRepository } from '../../domain/repositories/ProjectRepository';
import { ProjectRepositoryImpl } from '../../data/repositories/ProjectRepositoryImpl';
import type { AudioRepository } from '../../domain/repositories/AudioRepository';
import { AudioRepositoryImpl } from '../../data/repositories/AudioRepositoryImpl';
import { DAWPresenter } from '../../presentation/presenters/DAWPresenter';

export { TYPES };

// 創建並導出容器實例
export const container = new Container();

export function registerServices(container: Container): void {
  // Register Storage
  container.bind<Storage>(TYPES.Storage)
    .to(LocalStorage)
    .inSingletonScope();

  // Register Repositories
  container.bind<ClipRepository>(TYPES.ClipRepository)
    .to(ClipRepositoryImpl)
    .inSingletonScope();

  container.bind<TrackRepository>(TYPES.TrackRepository)
    .to(TrackRepositoryImpl)
    .inSingletonScope();

  container.bind<ProjectRepository>(TYPES.ProjectRepository)
    .to(ProjectRepositoryImpl)
    .inSingletonScope();

  container.bind<AudioRepository>(TYPES.AudioRepository)
    .to(AudioRepositoryImpl)
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
    .to(CustomAudioContext)
    .inSingletonScope();

  container.bind<IAudioEngine>(TYPES.AudioEngine)
    .to(AudioEngine)
    .inSingletonScope();

  // Register Presenters
  container.bind<DAWPresenter>(TYPES.DAWPresenter)
    .to(DAWPresenter)
    .inSingletonScope();

  // TODO: Register other services
} 