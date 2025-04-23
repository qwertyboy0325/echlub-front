import { injectable, inject } from 'inversify';
import { TrackTypes } from '../../../di/TrackTypes';
import { RemovePluginFromTrackCommand } from '../RemovePluginFromTrackCommand';
import type { ITrackRepository } from '../../../domain/repositories/ITrackRepository';
import { PluginRemovedFromTrackEvent } from '../../../domain/events/PluginRemovedFromTrackEvent';
import type { IEventBus } from '../../../../../core/event-bus/IEventBus';
import { PluginReferenceAdapter } from '../../../infrastructure/adapters/PluginReferenceAdapter';

@injectable()
export class RemovePluginFromTrackCommandHandler {
  constructor(
    @inject(TrackTypes.TrackRepository) private repository: ITrackRepository,
    @inject(TrackTypes.EventBus) private eventBus: IEventBus,
    @inject(TrackTypes.PluginReferenceAdapter) private pluginReferenceAdapter: PluginReferenceAdapter
  ) {}

  async handle(command: RemovePluginFromTrackCommand): Promise<void> {
    const track = await this.repository.findById(command.trackId);
    if (!track) {
      throw new Error(`Track with id ${command.trackId} not found`);
    }

    const pluginRef = this.pluginReferenceAdapter.toPluginReference(command.pluginRef.toString());
    track.removePlugin(pluginRef);
    await this.repository.save(track);

    const event = new PluginRemovedFromTrackEvent(command.trackId, command.pluginRef);
    await this.eventBus.publish(event);
  }
} 