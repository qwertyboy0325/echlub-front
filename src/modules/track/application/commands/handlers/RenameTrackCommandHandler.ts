import { injectable, inject } from 'inversify';
import { TrackTypes } from '../../../di/TrackTypes';
import { RenameTrackCommand } from '../RenameTrackCommand';
import type { ITrackRepository } from '../../../domain/repositories/ITrackRepository';
import { TrackRenamedEvent } from '../../../domain/events/TrackRenamedEvent';
import type { IEventBus } from '../../../../../core/event-bus/IEventBus';

@injectable()
export class RenameTrackCommandHandler {
  constructor(
    @inject(TrackTypes.TrackRepository) private repository: ITrackRepository,
    @inject(TrackTypes.EventBus) private eventBus: IEventBus
  ) {}

  async handle(command: RenameTrackCommand): Promise<void> {
    const track = await this.repository.findById(command.trackId);
    if (!track) {
      throw new Error(`Track with id ${command.trackId} not found`);
    }

    track.rename(command.newName);
    await this.repository.save(track);

    const event = new TrackRenamedEvent(command.trackId, command.newName);
    await this.eventBus.publish(event);
  }
} 