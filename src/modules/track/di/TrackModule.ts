import { Container } from 'inversify';
import { TrackTypes } from './TrackTypes';
import { ITrackRepository, ILocalTrackRepository } from '../domain/repositories/ITrackRepository';
import { LocalTrackRepository } from '../infrastructure/persistence/LocalTrackRepository';
import { TrackRepositoryCoordinator } from '../infrastructure/persistence/TrackRepositoryCoordinator';
import { TrackService } from '../application/services/TrackService';
import { TrackDomainService } from '../domain/services/TrackDomainService';
import { TrackValidator } from '../application/validators/TrackValidator';
import { TrackMediator } from '../application/mediators/TrackMediator';
import { ITrackFactory } from '../domain/factories/ITrackFactory';
import { AudioTrackFactory, InstrumentTrackFactory, BusTrackFactory, TrackFactoryRegistry } from '../domain/factories/TrackFactories';
import { TrackEventHandler } from '../integration/handlers/TrackEventHandler';
import { CreateTrackCommandHandler } from '../application/handlers/CreateTrackCommandHandler';
import { RenameTrackCommandHandler } from '../application/handlers/RenameTrackCommandHandler';
import { AddClipToTrackCommandHandler } from '../application/handlers/AddClipToTrackCommandHandler';
import { RemoveClipFromTrackCommandHandler } from '../application/handlers/RemoveClipFromTrackCommandHandler';
import { ChangeTrackRoutingCommandHandler } from '../application/handlers/ChangeTrackRoutingCommandHandler';
import { AddPluginToTrackCommandHandler } from '../application/handlers/AddPluginToTrackCommandHandler';
import { RemovePluginFromTrackCommandHandler } from '../application/handlers/RemovePluginFromTrackCommandHandler';
import { PluginReferenceAdapter } from '../infrastructure/adapters/PluginReferenceAdapter';

export class TrackModule {
  static configure(container: Container): void {
    // Repositories
    container.bind<ILocalTrackRepository>(TrackTypes.LocalTrackRepository)
      .to(LocalTrackRepository)
      .inSingletonScope();

    container.bind<ITrackRepository>(TrackTypes.TrackRepository)
      .to(TrackRepositoryCoordinator)
      .inSingletonScope();

    // Services
    container.bind(TrackTypes.TrackService)
      .to(TrackService)
      .inSingletonScope();

    container.bind(TrackTypes.TrackDomainService)
      .to(TrackDomainService)
      .inSingletonScope();

    container.bind(TrackTypes.TrackValidator)
      .to(TrackValidator)
      .inSingletonScope();

    // Adapters
    container.bind(TrackTypes.PluginReferenceAdapter)
      .to(PluginReferenceAdapter)
      .inSingletonScope();

    // Mediators
    container.bind(TrackTypes.TrackMediator)
      .to(TrackMediator)
      .inSingletonScope();

    // Track Factories
    container.bind<ITrackFactory>(TrackTypes.AudioTrackFactory)
      .to(AudioTrackFactory)
      .inSingletonScope();

    container.bind<ITrackFactory>(TrackTypes.InstrumentTrackFactory)
      .to(InstrumentTrackFactory)
      .inSingletonScope();

    container.bind<ITrackFactory>(TrackTypes.BusTrackFactory)
      .to(BusTrackFactory)
      .inSingletonScope();

    container.bind<TrackFactoryRegistry>(TrackTypes.TrackFactoryRegistry)
      .to(TrackFactoryRegistry)
      .inSingletonScope();

    // Event Handlers
    container.bind(TrackTypes.TrackEventHandler)
      .to(TrackEventHandler)
      .inSingletonScope();

    // Command Handlers
    container.bind(TrackTypes.CreateTrackCommandHandler)
      .to(CreateTrackCommandHandler)
      .inSingletonScope();

    container.bind(TrackTypes.RenameTrackCommandHandler)
      .to(RenameTrackCommandHandler)
      .inSingletonScope();

    container.bind(TrackTypes.AddClipToTrackCommandHandler)
      .to(AddClipToTrackCommandHandler)
      .inSingletonScope();

    container.bind(TrackTypes.RemoveClipFromTrackCommandHandler)
      .to(RemoveClipFromTrackCommandHandler)
      .inSingletonScope();

    container.bind(TrackTypes.ChangeTrackRoutingCommandHandler)
      .to(ChangeTrackRoutingCommandHandler)
      .inSingletonScope();

    container.bind(TrackTypes.AddPluginToTrackCommandHandler)
      .to(AddPluginToTrackCommandHandler)
      .inSingletonScope();

    container.bind(TrackTypes.RemovePluginFromTrackCommandHandler)
      .to(RemovePluginFromTrackCommandHandler)
      .inSingletonScope();
  }
} 