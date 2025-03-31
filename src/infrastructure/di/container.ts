import { Container } from 'inversify';
import type { Storage } from '../storage/Storage';
import { LocalStorage } from '../storage/LocalStorage';
import type { TrackRepository } from '../../domain/repositories/TrackRepository';
import { TrackRepositoryImpl } from '../../data/repositories/TrackRepositoryImpl';
import type { ClipRepository } from '../../domain/repositories/ClipRepository';
import { ClipRepositoryImpl } from '../../data/repositories/ClipRepositoryImpl';
import type { ProjectRepository } from '../../domain/repositories/ProjectRepository';
import { ProjectRepositoryImpl } from '../../data/repositories/ProjectRepositoryImpl';
import type { AudioRepository } from '../../domain/repositories/AudioRepository';
import { AudioRepositoryImpl } from '../../data/repositories/AudioRepositoryImpl';

export const container = new Container();

// 註冊存儲實現
container.bind<Storage>('Storage').to(LocalStorage);

// 註冊存儲庫實現
container.bind<TrackRepository>('TrackRepository').to(TrackRepositoryImpl);
container.bind<ClipRepository>('ClipRepository').to(ClipRepositoryImpl);
container.bind<ProjectRepository>('ProjectRepository').to(ProjectRepositoryImpl);
container.bind<AudioRepository>('AudioRepository').to(AudioRepositoryImpl).inSingletonScope(); 