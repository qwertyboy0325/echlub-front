import { ContainerModule } from 'inversify';
import { TYPES } from './types';
import { DAWPresenter } from '../../presentation/presenters/DAWPresenter';
import { DAWManager } from '../DAWManager';
import type { ClipRepository } from '../../domain/repositories/ClipRepository';
import type { TrackRepository } from '../../domain/repositories/TrackRepository';
import type { ProjectRepository } from '../../domain/repositories/ProjectRepository';
import { ClipRepositoryImpl } from '../../data/repositories/ClipRepositoryImpl';
import { TrackRepositoryImpl } from '../../data/repositories/TrackRepositoryImpl';
import { ProjectRepositoryImpl } from '../../data/repositories/ProjectRepositoryImpl';

export const dawModule = new ContainerModule((bind) => {
  // 綁定 Presenter
  bind<DAWPresenter>(TYPES.DAWPresenter)
    .to(DAWPresenter)
    .inSingletonScope();

  // 綁定 Manager
  bind<DAWManager>(TYPES.DAWManager)
    .to(DAWManager)
    .inSingletonScope();

  // 綁定 Repositories
  bind<ClipRepository>(TYPES.ClipRepository)
    .to(ClipRepositoryImpl)
    .inSingletonScope();

  bind<TrackRepository>(TYPES.TrackRepository)
    .to(TrackRepositoryImpl)
    .inSingletonScope();

  bind<ProjectRepository>(TYPES.ProjectRepository)
    .to(ProjectRepositoryImpl)
    .inSingletonScope();
}); 