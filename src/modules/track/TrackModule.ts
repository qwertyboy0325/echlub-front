import { ContainerModule } from 'inversify';
import { TrackTypes } from './di/TrackTypes';
import { ITrackRepository } from './domain/repositories/ITrackRepository';
import { IClipRepository } from './domain/repositories/IClipRepository';
import { LocalTrackRepository } from './infrastructure/repositories/LocalTrackRepository';
import { LocalClipRepository } from './infrastructure/repositories/LocalClipRepository';
import { TrackService } from './application/services/TrackService';
import { TrackMediator } from './application/mediators/TrackMediator';
import { TrackValidator } from './application/validators/TrackValidator';
import { CreateTrackCommandHandler } from './application/commands/handlers/CreateTrackCommandHandler';
import { RenameTrackCommandHandler } from './application/commands/handlers/RenameTrackCommandHandler';
import { AddClipToTrackCommandHandler } from './application/commands/handlers/AddClipToTrackCommandHandler';
import { RemoveClipFromTrackCommandHandler } from './application/commands/handlers/RemoveClipFromTrackCommandHandler';
import { ChangeTrackRoutingCommandHandler } from './application/commands/handlers/ChangeTrackRoutingCommandHandler';
import { AddPluginToTrackCommandHandler } from './application/commands/handlers/AddPluginToTrackCommandHandler';
import { RemovePluginFromTrackCommandHandler } from './application/commands/handlers/RemovePluginFromTrackCommandHandler';
import { AddInputTrackToBusCommandHandler } from './application/commands/handlers/AddInputTrackToBusCommandHandler';
import { RemoveInputTrackFromBusCommandHandler } from './application/commands/handlers/RemoveInputTrackFromBusCommandHandler';
import { AddNoteToClipCommandHandler } from './application/commands/handlers/AddNoteToClipCommandHandler';
import { UpdateNoteInClipCommandHandler } from './application/commands/handlers/UpdateNoteInClipCommandHandler';
import { RemoveNoteFromClipCommandHandler } from './application/commands/handlers/RemoveNoteFromClipCommandHandler';

export const TrackModule = new ContainerModule((bind) => {
  // Repositories
  bind<ITrackRepository>(TrackTypes.TrackRepository).to(LocalTrackRepository).inSingletonScope();
  bind<IClipRepository>(TrackTypes.ClipRepository).to(LocalClipRepository).inSingletonScope();

  // Services
  bind(TrackTypes.TrackService).to(TrackService).inSingletonScope();

  // Mediators & Validators
  bind(TrackTypes.TrackMediator).to(TrackMediator).inSingletonScope();
  bind(TrackTypes.TrackValidator).to(TrackValidator).inSingletonScope();

  // Command Handlers
  bind(TrackTypes.CreateTrackCommandHandler).to(CreateTrackCommandHandler).inSingletonScope();
  bind(TrackTypes.RenameTrackCommandHandler).to(RenameTrackCommandHandler).inSingletonScope();
  bind(TrackTypes.AddClipToTrackCommandHandler).to(AddClipToTrackCommandHandler).inSingletonScope();
  bind(TrackTypes.RemoveClipFromTrackCommandHandler).to(RemoveClipFromTrackCommandHandler).inSingletonScope();
  bind(TrackTypes.ChangeTrackRoutingCommandHandler).to(ChangeTrackRoutingCommandHandler).inSingletonScope();
  bind(TrackTypes.AddPluginToTrackCommandHandler).to(AddPluginToTrackCommandHandler).inSingletonScope();
  bind(TrackTypes.RemovePluginFromTrackCommandHandler).to(RemovePluginFromTrackCommandHandler).inSingletonScope();
  bind(TrackTypes.AddInputTrackToBusCommandHandler).to(AddInputTrackToBusCommandHandler).inSingletonScope();
  bind(TrackTypes.RemoveInputTrackFromBusCommandHandler).to(RemoveInputTrackFromBusCommandHandler).inSingletonScope();
  bind(TrackTypes.AddNoteToClipCommandHandler).to(AddNoteToClipCommandHandler).inSingletonScope();
  bind(TrackTypes.UpdateNoteInClipCommandHandler).to(UpdateNoteInClipCommandHandler).inSingletonScope();
  bind(TrackTypes.RemoveNoteFromClipCommandHandler).to(RemoveNoteFromClipCommandHandler).inSingletonScope();
}); 