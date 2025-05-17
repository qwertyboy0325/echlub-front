import { injectable, inject } from 'inversify';
import { TrackTypes } from '../../di/TrackTypes';
import { CreateTrackCommand } from '../commands/CreateTrackCommand';
import { RenameTrackCommand } from '../commands/RenameTrackCommand';
import { AddClipToTrackCommand } from '../commands/AddClipToTrackCommand';
import { RemoveClipFromTrackCommand } from '../commands/RemoveClipFromTrackCommand';
import { ChangeTrackRoutingCommand } from '../commands/ChangeTrackRoutingCommand';
import { AddPluginToTrackCommand } from '../commands/AddPluginToTrackCommand';
import { RemovePluginFromTrackCommand } from '../commands/RemovePluginFromTrackCommand';
import { AddInputTrackToBusCommand } from '../commands/AddInputTrackToBusCommand';
import { RemoveInputTrackFromBusCommand } from '../commands/RemoveInputTrackFromBusCommand';
import { CreateTrackCommandHandler } from '../handlers/CreateTrackCommandHandler';
import { RenameTrackCommandHandler } from '../handlers/RenameTrackCommandHandler';
import { AddClipToTrackCommandHandler } from '../handlers/AddClipToTrackCommandHandler';
import { RemoveClipFromTrackCommandHandler } from '../handlers/RemoveClipFromTrackCommandHandler';
import { ChangeTrackRoutingCommandHandler } from '../handlers/ChangeTrackRoutingCommandHandler';
import { AddPluginToTrackCommandHandler } from '../handlers/AddPluginToTrackCommandHandler';
import { RemovePluginFromTrackCommandHandler } from '../handlers/RemovePluginFromTrackCommandHandler';
import { AddInputTrackToBusCommandHandler } from '../handlers/AddInputTrackToBusCommandHandler';
import { RemoveInputTrackFromBusCommandHandler } from '../handlers/RemoveInputTrackFromBusCommandHandler';
import { TrackId } from '../../domain/value-objects/TrackId';

@injectable()
export class TrackMediator {
  constructor(
    @inject(TrackTypes.CreateTrackCommandHandler) private createTrackHandler: CreateTrackCommandHandler,
    @inject(TrackTypes.RenameTrackCommandHandler) private renameTrackHandler: RenameTrackCommandHandler,
    @inject(TrackTypes.AddClipToTrackCommandHandler) private addClipHandler: AddClipToTrackCommandHandler,
    @inject(TrackTypes.RemoveClipFromTrackCommandHandler) private removeClipHandler: RemoveClipFromTrackCommandHandler,
    @inject(TrackTypes.ChangeTrackRoutingCommandHandler) private changeRoutingHandler: ChangeTrackRoutingCommandHandler,
    @inject(TrackTypes.AddPluginToTrackCommandHandler) private addPluginHandler: AddPluginToTrackCommandHandler,
    @inject(TrackTypes.RemovePluginFromTrackCommandHandler) private removePluginHandler: RemovePluginFromTrackCommandHandler,
    @inject(TrackTypes.AddInputTrackToBusCommandHandler) private addInputTrackHandler: AddInputTrackToBusCommandHandler,
    @inject(TrackTypes.RemoveInputTrackFromBusCommandHandler) private removeInputTrackHandler: RemoveInputTrackFromBusCommandHandler
  ) {}

  async createTrack(command: CreateTrackCommand): Promise<TrackId> {
    return this.createTrackHandler.handle(command);
  }

  async renameTrack(command: RenameTrackCommand): Promise<void> {
    return this.renameTrackHandler.handle(command);
  }

  async addClipToTrack(command: AddClipToTrackCommand): Promise<void> {
    return this.addClipHandler.handle(command);
  }

  async removeClipFromTrack(command: RemoveClipFromTrackCommand): Promise<void> {
    return this.removeClipHandler.handle(command);
  }

  async changeTrackRouting(command: ChangeTrackRoutingCommand): Promise<void> {
    return this.changeRoutingHandler.handle(command);
  }

  async addPluginToTrack(command: AddPluginToTrackCommand): Promise<void> {
    return this.addPluginHandler.handle(command);
  }

  async removePluginFromTrack(command: RemovePluginFromTrackCommand): Promise<void> {
    return this.removePluginHandler.handle(command);
  }

  async addInputTrackToBus(command: AddInputTrackToBusCommand): Promise<void> {
    return this.addInputTrackHandler.handle(command);
  }

  async removeInputTrackFromBus(command: RemoveInputTrackFromBusCommand): Promise<void> {
    return this.removeInputTrackHandler.handle(command);
  }
} 
