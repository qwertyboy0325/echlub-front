import { injectable, inject } from 'inversify';
import { TrackTypes } from '../../../di/TrackTypes';
import { UpdateAudioClipCommand } from '../UpdateAudioClipCommand';
import type { IClipRepository } from '../../../domain/repositories/IClipRepository';
import type { IEventBus } from '../../../../../core/event-bus/IEventBus';
import { AudioClip } from '../../../domain/entities/clips/AudioClip';
import { AudioClipUpdatedEvent } from '../../../domain/events/AudioClipUpdatedEvent';

@injectable()
export class UpdateAudioClipCommandHandler {
  constructor(
    @inject(TrackTypes.ClipRepository) private repository: IClipRepository,
    @inject(TrackTypes.EventBus) private eventBus: IEventBus
  ) {}

  async handle(command: UpdateAudioClipCommand): Promise<void> {
    const clip = await this.repository.findById(command.clipId);
    if (!clip) {
      throw new Error(`Clip with id ${command.clipId} not found`);
    }

    if (!(clip instanceof AudioClip)) {
      throw new Error('Clip is not an audio clip');
    }

    const { changes } = command;

    if (changes.gain !== undefined) {
      clip.setGain(changes.gain);
    }

    if (changes.offset !== undefined) {
      clip.setOffset(changes.offset);
    }

    if (changes.fadeIn !== undefined) {
      clip.setFadeIn(changes.fadeIn);
    }

    if (changes.fadeOut !== undefined) {
      clip.setFadeOut(changes.fadeOut);
    }

    await this.repository.save(clip);

    const event = new AudioClipUpdatedEvent(command.clipId.toString(), changes);
    await this.eventBus.publish(event);
  }
} 