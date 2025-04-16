import { injectable, inject } from 'inversify';
import { TrackTypes } from '../../di/TrackTypes';
import { AddPluginToTrackCommand } from '../commands/AddPluginToTrackCommand';
import type { ITrackRepository } from '../../domain/repositories/ITrackRepository';
import { PluginAddedToTrackEvent } from '../../domain/events/PluginAddedToTrackEvent';
import type { IEventBus } from '../../../../core/event-bus/IEventBus';

@injectable()
export class AddPluginToTrackCommandHandler {
  constructor(
    @inject(TrackTypes.TrackRepository) private repository: ITrackRepository,
    @inject(TrackTypes.EventBus) private eventBus: IEventBus
  ) {}

  async handle(command: AddPluginToTrackCommand): Promise<void> {
    const track = await this.repository.findById(command.trackId);
    if (!track) {
      throw new Error(`Track with id ${command.trackId} not found`);
    }

    track.addPlugin(command.pluginId);
    await this.repository.save(track);

    const event = new PluginAddedToTrackEvent(track.getTrackId(), command.pluginId);
    await this.eventBus.publish(event);
  }
} 