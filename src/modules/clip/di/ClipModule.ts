import { Container } from 'inversify';
import { ClipTypes } from './ClipTypes';
import { IClipRepository, ILocalClipRepository } from '../domain/repositories/IClipRepository';
import { LocalClipRepository } from '../infrastructure/persistence/LocalClipRepository';
import { CreateAudioClipCommandHandler } from '../application/handlers/CreateAudioClipCommandHandler';
import { ClipStore } from '../infrastructure/stores/ClipStore';
import { P2PSyncManager } from '../infrastructure/p2p/P2PSyncManager';
import { ApiClient } from '../infrastructure/api/ApiClient';
import { ClipMediator } from '../application/mediators/ClipMediator';
import { ClipValidator } from '../domain/validators/ClipValidator';

export class ClipModule {
  static configure(container: Container): void {
    // Repositories
    container.bind<IClipRepository>(ClipTypes.ClipRepository)
      .to(LocalClipRepository)
      .inSingletonScope();
    
    container.bind<ILocalClipRepository>(ClipTypes.LocalClipRepository)
      .to(LocalClipRepository)
      .inSingletonScope();

    // Command Handlers
    container.bind<CreateAudioClipCommandHandler>(ClipTypes.CreateAudioClipCommandHandler)
      .to(CreateAudioClipCommandHandler)
      .inSingletonScope();

    // Mediators & Validators
    container.bind<ClipMediator>(ClipTypes.ClipMediator)
      .to(ClipMediator)
      .inSingletonScope();

    container.bind<ClipValidator>(ClipTypes.ClipValidator)
      .to(ClipValidator)
      .inSingletonScope();

    // Infrastructure
    container.bind<ClipStore>(ClipTypes.ClipStore)
      .to(ClipStore)
      .inSingletonScope();

    container.bind<P2PSyncManager>(ClipTypes.P2PSyncManager)
      .to(P2PSyncManager)
      .inSingletonScope();

    container.bind<ApiClient>(ClipTypes.ApiClient)
      .to(ApiClient)
      .inSingletonScope();
  }
} 