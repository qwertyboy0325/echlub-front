import { injectable, inject } from 'inversify';
import { TrackTypes } from '../../di/TrackTypes';
import { RemovePluginFromTrackCommand } from '../commands/RemovePluginFromTrackCommand';
import { ITrackRepository } from '../../domain/repositories/ITrackRepository';
import { PluginRemovedFromTrackEvent } from '../../domain/events/PluginRemovedFromTrackEvent';
import { IEventBus } from '../../../../core/event-bus/IEventBus';

@injectable()
export class RemovePluginFromTrackCommandHandler {
  constructor(
    @inject(TrackTypes.TrackRepository) private repository: ITrackRepository,
    @inject(TrackTypes.EventBus) private eventBus: IEventBus
  ) {}

  async handle(command: RemovePluginFromTrackCommand): Promise<void> {
    const track = await this.repository.findById(command.trackId);
    if (!track) {
      throw new Error(`Track with id ${command.trackId} not found`);
    }

    track.removePlugin(command.pluginId);
    await this.repository.save(track);

    const event = new PluginRemovedFromTrackEvent(track.getTrackId(), command.pluginId);
    await this.eventBus.publish(event);
  }
} 