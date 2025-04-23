import { injectable, inject } from 'inversify';
import { TrackTypes } from '../../../di/TrackTypes';
import { AddPluginToTrackCommand } from '../AddPluginToTrackCommand';
import type { ITrackRepository } from '../../../domain/repositories/ITrackRepository';
import { PluginAddedToTrackEvent } from '../../../domain/events/PluginAddedToTrackEvent';
import type { IEventBus } from '../../../../../core/event-bus/IEventBus';
import { PluginInstanceId } from '../../../../plugin/domain/value-objects/PluginInstanceId';

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

    track.addPlugin(command.pluginRef);
    await this.repository.save(track);

    const pluginInstanceId = PluginInstanceId.fromString(command.pluginRef.toString());
    const event = new PluginAddedToTrackEvent(command.trackId, pluginInstanceId);
    await this.eventBus.publish(event);
  }
} 