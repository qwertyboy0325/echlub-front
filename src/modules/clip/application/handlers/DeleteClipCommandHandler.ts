import { injectable, inject } from 'inversify';
import { ClipTypes } from '../../di/ClipTypes';
import { DeleteClipCommand } from '../commands/DeleteClipCommand';
import type { IClipRepository } from '../../domain/repositories/IClipRepository';
import { ClipDeletedEvent } from '../../domain/events/ClipEvents';
import type { IEventBus } from '../../../../core/event-bus/IEventBus';
import { ClipOperationError } from '../../domain/errors/ClipError';

@injectable()
export class DeleteClipCommandHandler {
  constructor(
    @inject(ClipTypes.ClipRepository) private repository: IClipRepository,
    @inject(ClipTypes.EventBus) private eventBus: IEventBus
  ) {}

  async handle(command: DeleteClipCommand): Promise<void> {
    const clip = await this.repository.findById(command.clipId);
    if (!clip) {
      throw new ClipOperationError(`Clip with id ${command.clipId} not found`);
    }

    // 刪除片段
    await this.repository.delete(command.clipId);

    // 發布事件
    await this.eventBus.publish(new ClipDeletedEvent(command.clipId));
  }
} 