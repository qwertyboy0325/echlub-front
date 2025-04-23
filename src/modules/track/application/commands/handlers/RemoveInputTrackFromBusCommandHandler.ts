import { injectable, inject } from 'inversify';
import { TrackTypes } from '../../../di/TrackTypes';
import { RemoveInputTrackFromBusCommand } from '../RemoveInputTrackFromBusCommand';
import type { ITrackRepository } from '../../../domain/repositories/ITrackRepository';
import type { IEventBus } from '../../../../../core/event-bus/IEventBus';
import { BusTrack } from '../../../domain/entities/BusTrack';
import { TrackOperationError } from '../../../domain/errors/TrackError';

@injectable()
export class RemoveInputTrackFromBusCommandHandler {
  constructor(
    @inject(TrackTypes.TrackRepository) private repository: ITrackRepository,
    @inject(TrackTypes.EventBus) private eventBus: IEventBus
  ) {}

  async handle(command: RemoveInputTrackFromBusCommand): Promise<void> {
    const track = await this.repository.findById(command.busTrackId);
    if (!track) {
      throw new TrackOperationError('Track not found');
    }

    if (!(track instanceof BusTrack)) {
      throw new TrackOperationError('Track is not a bus track');
    }

    const inputTrack = await this.repository.findById(command.inputTrackId);
    if (!inputTrack) {
      throw new TrackOperationError('Input track not found');
    }

    track.removeInputTrack(command.inputTrackId);
    await this.repository.save(track);

    await this.eventBus.publish({
      eventType: 'track:input:removed',
      timestamp: new Date(),
      aggregateId: command.busTrackId.toString(),
      payload: {
        inputTrackId: command.inputTrackId.toString()
      }
    });
  }
} 