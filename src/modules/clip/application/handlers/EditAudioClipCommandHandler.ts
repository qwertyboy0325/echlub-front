import { injectable, inject } from 'inversify';
import { ClipTypes } from '../../di/ClipTypes';
import { EditAudioClipCommand } from '../commands/audio/EditAudioClipCommand';
import type { IClipRepository } from '../../domain/repositories/IClipRepository';
import { AudioClipEditedEvent } from '../../domain/events/ClipEvents';
import { AudioClip } from '../../domain/entities/AudioClip';
import type { IEventBus } from '../../../../core/event-bus/IEventBus';

@injectable()
export class EditAudioClipCommandHandler {
  constructor(
    @inject(ClipTypes.ClipRepository) private repository: IClipRepository,
    @inject(ClipTypes.EventBus) private eventBus: IEventBus
  ) {}

  async handle(command: EditAudioClipCommand): Promise<void> {
    const clip = await this.repository.findById(command.clipId);
    if (!clip) {
      throw new Error(`Audio clip not found: ${command.clipId.toString()}`);
    }

    if (!(clip instanceof AudioClip)) {
      throw new Error(`Clip ${command.clipId.toString()} is not an audio clip`);
    }

    const { changes } = command;
    
    // 應用更改
    if (changes.gain !== undefined) {
      clip.setGain(changes.gain);
    }
    if (changes.fadeIn !== undefined) {
      clip.setFadeIn(changes.fadeIn);
    }
    if (changes.fadeOut !== undefined) {
      clip.setFadeOut(changes.fadeOut);
    }

    // 保存更改
    await this.repository.save(clip);

    // 發布事件
    const event = new AudioClipEditedEvent(command.clipId, changes);
    await this.eventBus.publish(event);
  }
} 