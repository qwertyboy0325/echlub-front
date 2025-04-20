import { injectable, inject } from 'inversify';
import { ClipTypes } from '../../di/ClipTypes';
import { UpdateClipCommand } from '../commands/common/UpdateClipCommand';
import type { IClipRepository } from '../../domain/repositories/IClipRepository';
import type { IEventBus } from '../../../../core/event-bus/IEventBus';
import { ClipOperationError } from '../../domain/errors/ClipError';

@injectable()
export class UpdateClipCommandHandler {
  constructor(
    @inject(ClipTypes.ClipRepository) private repository: IClipRepository
  ) {}

  async handle(command: UpdateClipCommand): Promise<void> {
    const clip = await this.repository.findById(command.clipId);
    if (!clip) {
      throw new Error(`Clip not found: ${command.clipId}`);
    }

    if (command.updates.gain !== undefined) {
      clip.setGain(command.updates.gain);
    }

    await this.repository.save(clip);
  }
} 