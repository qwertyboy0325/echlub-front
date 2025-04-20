import { injectable, inject } from 'inversify';
import { ClipTypes } from '../../di/ClipTypes';
import type { IClipRepository } from '../../domain/repositories/IClipRepository';
import { UpdateClipCommand } from '../commands';

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