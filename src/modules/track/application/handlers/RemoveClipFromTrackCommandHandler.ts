import { injectable, inject } from 'inversify';
import { TrackTypes } from '../../di/TrackTypes';
import { RemoveClipFromTrackCommand } from '../commands/RemoveClipFromTrackCommand';
import type { ITrackRepository } from '../../domain/repositories/ITrackRepository';
import { ClipRemovedFromTrackEvent } from '../../domain/events/ClipRemovedFromTrackEvent';
import type { IEventBus } from '../../../../core/event-bus/IEventBus';
import { AudioClipId } from '../../domain/value-objects/AudioClipId';

@injectable()
export class RemoveClipFromTrackCommandHandler {
  constructor(
    @inject(TrackTypes.TrackRepository) private repository: ITrackRepository,
    @inject(TrackTypes.EventBus) private eventBus: IEventBus
  ) {}

  async handle(command: RemoveClipFromTrackCommand): Promise<void> {
    const track = await this.repository.findById(command.trackId);
    if (!track) {
      throw new Error(`Track with id ${command.trackId} not found`);
    }

    const clipType = command.clipId instanceof AudioClipId ? 'audio' : 'midi';
    track.removeClip(command.clipId);
    await this.repository.save(track);

    const event = new ClipRemovedFromTrackEvent(track.getTrackId(), command.clipId, clipType);
    await this.eventBus.publish(event);
  }
} 