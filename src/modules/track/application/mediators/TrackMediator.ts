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
import { AddNoteToClipCommand } from '../commands/AddNoteToClipCommand';
import { UpdateNoteInClipCommand } from '../commands/UpdateNoteInClipCommand';
import { RemoveNoteFromClipCommand } from '../commands/RemoveNoteFromClipCommand';
import { DeleteTrackCommand } from '../commands/DeleteTrackCommand';
import { CreateTrackCommandHandler } from '../commands/handlers/CreateTrackCommandHandler';
import { RenameTrackCommandHandler } from '../commands/handlers/RenameTrackCommandHandler';
import { AddClipToTrackCommandHandler } from '../commands/handlers/AddClipToTrackCommandHandler';
import { RemoveClipFromTrackCommandHandler } from '../commands/handlers/RemoveClipFromTrackCommandHandler';
import { ChangeTrackRoutingCommandHandler } from '../commands/handlers/ChangeTrackRoutingCommandHandler';
import { AddPluginToTrackCommandHandler } from '../commands/handlers/AddPluginToTrackCommandHandler';
import { RemovePluginFromTrackCommandHandler } from '../commands/handlers/RemovePluginFromTrackCommandHandler';
import { AddInputTrackToBusCommandHandler } from '../commands/handlers/AddInputTrackToBusCommandHandler';
import { RemoveInputTrackFromBusCommandHandler } from '../commands/handlers/RemoveInputTrackFromBusCommandHandler';
import { AddNoteToClipCommandHandler } from '../commands/handlers/AddNoteToClipCommandHandler';
import { UpdateNoteInClipCommandHandler } from '../commands/handlers/UpdateNoteInClipCommandHandler';
import { RemoveNoteFromClipCommandHandler } from '../commands/handlers/RemoveNoteFromClipCommandHandler';
import { DeleteTrackCommandHandler } from '../commands/handlers/DeleteTrackCommandHandler';
import { TrackId } from '../../domain/value-objects/track/TrackId';
import { GetTrackByIdQuery } from '../queries/GetTrackByIdQuery';
import { GetTrackPluginsQuery } from '../queries/GetTrackPluginsQuery';
import { GetTrackRoutingQuery } from '../queries/GetTrackRoutingQuery';
import { GetTrackGainQuery } from '../queries/GetTrackGainQuery';
import { GetTrackNameQuery } from '../queries/GetTrackNameQuery';
import { GetTrackByIdQueryHandler } from '../queries/handlers/GetTrackByIdQueryHandler';
import { GetTrackPluginsQueryHandler } from '../queries/handlers/GetTrackPluginsQueryHandler';
import { GetTrackRoutingQueryHandler } from '../queries/handlers/GetTrackRoutingQueryHandler';
import { GetTrackGainQueryHandler } from '../queries/handlers/GetTrackGainQueryHandler';
import { GetTrackNameQueryHandler } from '../queries/handlers/GetTrackNameQueryHandler';
import { BaseTrack } from '../../domain/entities/BaseTrack';
import { IPluginReference } from '../../domain/interfaces/IPluginReference';
import { TrackRouting } from '../../domain/value-objects/track/TrackRouting';

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
    @inject(TrackTypes.RemoveInputTrackFromBusCommandHandler) private removeInputTrackHandler: RemoveInputTrackFromBusCommandHandler,
    @inject(TrackTypes.AddNoteToClipCommandHandler) private addNoteHandler: AddNoteToClipCommandHandler,
    @inject(TrackTypes.UpdateNoteInClipCommandHandler) private updateNoteHandler: UpdateNoteInClipCommandHandler,
    @inject(TrackTypes.RemoveNoteFromClipCommandHandler) private removeNoteHandler: RemoveNoteFromClipCommandHandler,
    @inject(TrackTypes.DeleteTrackCommandHandler) private deleteTrackHandler: DeleteTrackCommandHandler,
    @inject(TrackTypes.GetTrackByIdQueryHandler) private getTrackByIdHandler: GetTrackByIdQueryHandler,
    @inject(TrackTypes.GetTrackPluginsQueryHandler) private getTrackPluginsHandler: GetTrackPluginsQueryHandler,
    @inject(TrackTypes.GetTrackRoutingQueryHandler) private getTrackRoutingHandler: GetTrackRoutingQueryHandler,
    @inject(TrackTypes.GetTrackGainQueryHandler) private getTrackGainHandler: GetTrackGainQueryHandler,
    @inject(TrackTypes.GetTrackNameQueryHandler) private getTrackNameHandler: GetTrackNameQueryHandler
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

  async addNoteToClip(command: AddNoteToClipCommand): Promise<void> {
    return this.addNoteHandler.handle(command);
  }

  async updateNoteInClip(command: UpdateNoteInClipCommand): Promise<void> {
    return this.updateNoteHandler.handle(command);
  }

  async removeNoteFromClip(command: RemoveNoteFromClipCommand): Promise<void> {
    return this.removeNoteHandler.handle(command);
  }

  async deleteTrack(command: DeleteTrackCommand): Promise<void> {
    return this.deleteTrackHandler.handle(command);
  }

  /**
   * 獲取軌道實體
   */
  async getTrackById(query: GetTrackByIdQuery): Promise<BaseTrack> {
    return this.getTrackByIdHandler.handle(query);
  }

  /**
   * 獲取軌道插件列表
   */
  async getTrackPlugins(query: GetTrackPluginsQuery): Promise<IPluginReference[]> {
    return this.getTrackPluginsHandler.handle(query);
  }

  /**
   * 獲取軌道路由設置
   */
  async getTrackRouting(query: GetTrackRoutingQuery): Promise<TrackRouting> {
    return this.getTrackRoutingHandler.handle(query);
  }

  /**
   * 獲取軌道音量
   */
  async getTrackGain(query: GetTrackGainQuery): Promise<number> {
    return this.getTrackGainHandler.handle(query);
  }

  /**
   * 獲取軌道名稱
   */
  async getTrackName(query: GetTrackNameQuery): Promise<string> {
    return this.getTrackNameHandler.handle(query);
  }
} 