import { injectable, inject } from 'inversify';
import { TrackTypes } from '../../di/TrackTypes';
import { ChangeTrackRoutingCommand } from '../commands/ChangeTrackRoutingCommand';
import { ITrackRepository } from '../../domain/repositories/ITrackRepository';
import { TrackRoutingChangedEvent } from '../../domain/events/TrackRoutingChangedEvent';
import { IEventBus } from '../../../../core/event-bus/IEventBus';

@injectable()
export class ChangeTrackRoutingCommandHandler {
  constructor(
    @inject(TrackTypes.TrackRepository) private repository: ITrackRepository,
    @inject(TrackTypes.EventBus) private eventBus: IEventBus
  ) {}

  async handle(command: ChangeTrackRoutingCommand): Promise<void> {
    const track = await this.repository.findById(command.trackId);
    if (!track) {
      throw new Error(`Track with id ${command.trackId} not found`);
    }

    track.updateRouting(command.routing);
    await this.repository.save(track);

    const event = new TrackRoutingChangedEvent(track.getTrackId(), command.routing);
    await this.eventBus.publish(event);
  }
} 