import { Container } from 'inversify';
import { ClipTypes } from './ClipTypes';
import { IClipRepository, ILocalClipRepository } from '../domain/repositories/IClipRepository';
import { LocalClipRepository } from '../infrastructure/persistence/LocalClipRepository';
import { CreateAudioClipCommandHandler } from '../application/handlers/CreateAudioClipCommandHandler';
import { ClipStore } from '../infrastructure/stores/ClipStore';
import { P2PSyncManager } from '../infrastructure/p2p/P2PSyncManager';
import { ApiClient } from '../infrastructure/api/ApiClient';

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