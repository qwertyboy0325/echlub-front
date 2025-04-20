import { injectable, inject } from 'inversify';
import { ClipTypes } from '../../di/ClipTypes';
import { CreateAudioClipCommand } from '../commands/ClipCommands';
import type { IClipRepository } from '../../domain/repositories/IClipRepository';
import { AudioClipCreatedEvent } from '../../domain/events/ClipEvents';
import { ClipId } from '../../domain/value-objects/ClipId';
import { AudioClip } from '../../domain/entities/AudioClip';
import type { IEventBus } from '../../../../core/event-bus/IEventBus';

@injectable()
export class CreateAudioClipCommandHandler {
  constructor(
    @inject(ClipTypes.ClipRepository) private repository: IClipRepository,
    @inject(ClipTypes.EventBus) private eventBus: IEventBus
  ) {}

  async handle(command: CreateAudioClipCommand): Promise<ClipId> {
    const clipId = ClipId.create();
    const clip = new AudioClip(
      clipId,
      command.sampleId,
      command.startTime,
      command.duration,
      command.offset
    );
    
    await this.repository.save(clip);
    
    const event = new AudioClipCreatedEvent(
      clipId,
      command.sampleId,
      command.startTime,
      command.duration
    );
    await this.eventBus.publish(event);
    
    return clipId;
  }
} 