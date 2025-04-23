import { injectable, inject } from 'inversify';
import { TrackTypes } from '../../../di/TrackTypes';
import { AddInputTrackToBusCommand } from '../AddInputTrackToBusCommand';
import type { ITrackRepository } from '../../../domain/repositories/ITrackRepository';
import { InputTrackAddedToBusEvent } from '../../../domain/events/InputTrackAddedToBusEvent';
import type { IEventBus } from '../../../../../core/event-bus/IEventBus';
import { BusTrack } from '../../../domain/entities/BusTrack';

@injectable()
export class AddInputTrackToBusCommandHandler {
  constructor(
    @inject(TrackTypes.TrackRepository) private repository: ITrackRepository,
    @inject(TrackTypes.EventBus) private eventBus: IEventBus
  ) {}

  async handle(command: AddInputTrackToBusCommand): Promise<void> {
    const track = await this.repository.findById(command.busTrackId);
    if (!track) {
      throw new Error(`Bus track with id ${command.busTrackId} not found`);
    }

    if (!(track instanceof BusTrack)) {
      throw new Error('Track is not a bus track');
    }

    track.addInputTrack(command.inputTrackId);
    await this.repository.save(track);

    const event = new InputTrackAddedToBusEvent(command.busTrackId, command.inputTrackId);
    await this.eventBus.publish(event);
  }
} 