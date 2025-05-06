import { injectable, inject } from 'inversify';
import { TrackTypes } from '../../di/TrackTypes';
import { AddClipToTrackCommand } from '../commands/AddClipToTrackCommand';
import type { ITrackRepository } from '../../domain/repositories/ITrackRepository';
import { ClipAddedToTrackEvent } from '../../domain/events/ClipAddedToTrackEvent';
import type { IEventBus } from '../../../../core/event-bus/IEventBus';
import { AudioClipId } from '../../domain/value-objects/AudioClipId';

@injectable()
export class AddClipToTrackCommandHandler {
  constructor(
    @inject(TrackTypes.TrackRepository) private repository: ITrackRepository,
    @inject(TrackTypes.EventBus) private eventBus: IEventBus
  ) {}

  async handle(command: AddClipToTrackCommand): Promise<void> {
    const track = await this.repository.findById(command.trackId);
    if (!track) {
      throw new Error(`Track with id ${command.trackId} not found`);
    }

    const clipType = command.clipId instanceof AudioClipId ? 'audio' : 'midi';
    track.addClip(command.clipId);
    await this.repository.save(track);

    const event = new ClipAddedToTrackEvent(track.getTrackId(), command.clipId, clipType);
    await this.eventBus.publish(event);
  }
} 