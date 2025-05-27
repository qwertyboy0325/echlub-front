import { injectable, inject } from 'inversify';
import type { ICommandHandler } from '../../../../core/mediator/ICommandHandler';
import type { RemoveClipCommand } from '../commands/RemoveClipCommand';
import type { TrackRepository } from '../../domain/repositories/TrackRepository';
import { MusicArrangementTypes } from '../../di/MusicArrangementTypes';

@injectable()
export class RemoveClipCommandHandler implements ICommandHandler<RemoveClipCommand, void> {
  constructor(
    @inject(MusicArrangementTypes.TrackRepository)
    private readonly trackRepository: TrackRepository
  ) {}

  async handle(command: RemoveClipCommand): Promise<void> {
    const track = await this.trackRepository.loadWithClips(command.trackId);
    if (!track) {
      throw new Error(`Track not found: ${command.trackId.value}`);
    }

    track.removeClip(command.clipId);

    await this.trackRepository.saveWithClips(track);

    // Publish domain events
    const events = track.getUncommittedEvents();
    events.forEach(event => {
      console.log('Domain event:', event);
    });
    track.clearUncommittedEvents();
  }
} 