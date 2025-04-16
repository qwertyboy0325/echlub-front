import { injectable, inject } from 'inversify';
import { TrackTypes } from '../../di/TrackTypes';
import { CreateTrackCommand } from '../commands/CreateTrackCommand';
import type { ITrackRepository } from '../../domain/repositories/ITrackRepository';
import { TrackCreatedEvent } from '../../domain/events/TrackCreatedEvent';
import type { IEventBus } from '../../../../core/event-bus/IEventBus';
import { TrackId } from '../../domain/value-objects/TrackId';
import { AudioTrack } from '../../domain/entities/AudioTrack';
import { TrackRouting } from '../../domain/value-objects/TrackRouting';

@injectable()
export class CreateTrackCommandHandler {
  constructor(
    @inject(TrackTypes.TrackRepository) private repository: ITrackRepository,
    @inject(TrackTypes.EventBus) private eventBus: IEventBus
  ) {}

  async handle(command: CreateTrackCommand): Promise<TrackId> {
    const trackId = TrackId.create();
    const routing = new TrackRouting(null, null);
    const track = new AudioTrack(trackId, command.name, routing, command.type);
    await this.repository.create(track);
    const event = new TrackCreatedEvent(trackId, command.name, command.type);
    await this.eventBus.publish(event);
    return trackId;
  }
} 