import { injectable, inject } from 'inversify';
import { ClipTypes } from '../../di/ClipTypes';
import { ClipId } from '../../domain/value-objects/ClipId';
import { CreateAudioClipCommand, CreateMidiClipCommand, UpdateClipCommand, DeleteClipCommand } from '../commands';
import type { CreateAudioClipCommandHandler } from '../handlers/CreateAudioClipCommandHandler';
import type { CreateMidiClipCommandHandler } from '../handlers/CreateMidiClipCommandHandler';
import type { UpdateClipCommandHandler } from '../handlers/UpdateClipCommandHandler';
import type { DeleteClipCommandHandler } from '../handlers/DeleteClipCommandHandler';

@injectable()
export class ClipMediator {
  constructor(
    @inject(ClipTypes.CreateAudioClipCommandHandler)
    private createAudioClipHandler: CreateAudioClipCommandHandler,
    @inject(ClipTypes.CreateMidiClipCommandHandler)
    private createMidiClipHandler: CreateMidiClipCommandHandler,
    @inject(ClipTypes.UpdateClipCommandHandler)
    private updateClipHandler: UpdateClipCommandHandler,
    @inject(ClipTypes.DeleteClipCommandHandler)
    private deleteClipHandler: DeleteClipCommandHandler
  ) {}

  async createAudioClip(command: CreateAudioClipCommand): Promise<ClipId> {
    return this.createAudioClipHandler.handle(command);
  }

  async createMidiClip(command: CreateMidiClipCommand): Promise<ClipId> {
    return this.createMidiClipHandler.handle(command);
  }

  async updateClip(command: UpdateClipCommand): Promise<void> {
    return this.updateClipHandler.handle(command);
  }

  async deleteClip(command: DeleteClipCommand): Promise<void> {
    return this.deleteClipHandler.handle(command);
  }
} 