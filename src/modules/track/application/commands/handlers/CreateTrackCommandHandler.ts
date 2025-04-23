import { injectable, inject } from 'inversify';
import { TrackTypes } from '../../../di/TrackTypes';
import { CreateTrackCommand } from '../CreateTrackCommand';
import type { ITrackRepository } from '../../../domain/repositories/ITrackRepository';
import { TrackCreatedEvent } from '../../../domain/events/TrackCreatedEvent';
import type { IEventBus } from '../../../../../core/event-bus/IEventBus';
import { TrackId } from '../../../domain/value-objects/track/TrackId';
import { TrackFactoryRegistry } from '../../../domain/factories/TrackFactories';

@injectable()
export class CreateTrackCommandHandler {
  constructor(
    @inject(TrackTypes.TrackRepository) private repository: ITrackRepository,
    @inject(TrackTypes.EventBus) private eventBus: IEventBus,
    @inject(TrackTypes.TrackFactoryRegistry) private trackFactoryRegistry: TrackFactoryRegistry
  ) {}

  async handle(command: CreateTrackCommand): Promise<TrackId> {
    const trackId = TrackId.create();
    const track = this.trackFactoryRegistry.createTrack(
      command.type,
      trackId,
      command.name
    );
    
    await this.repository.save(track);
    
    const event = new TrackCreatedEvent(trackId, command.name, command.type);
    await this.eventBus.publish(event);
    
    return trackId;
  }
} 