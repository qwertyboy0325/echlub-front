import { injectable, inject } from 'inversify';
import type { ICommandHandler } from '../../../../core/mediator/ICommandHandler';
import type { TransposeMidiClipCommand } from '../commands/TransposeMidiClipCommand';
import type { TrackRepository } from '../../domain/repositories/TrackRepository';
import { MusicArrangementTypes } from '../../di/MusicArrangementTypes';

@injectable()
export class TransposeMidiClipCommandHandler implements ICommandHandler<TransposeMidiClipCommand, void> {
  constructor(
    @inject(MusicArrangementTypes.TrackRepository)
    private readonly trackRepository: TrackRepository
  ) {}

  async handle(command: TransposeMidiClipCommand): Promise<void> {
    const track = await this.trackRepository.loadWithClips(command.trackId);
    if (!track) {
      throw new Error(`Track not found: ${command.trackId.value}`);
    }

    track.transposeMidiClip(command.clipId, command.semitones);

    await this.trackRepository.saveWithClips(track);

    // Publish domain events
    const events = track.getUncommittedEvents();
    events.forEach(event => {
      console.log('Domain event:', event);
    });
    track.clearUncommittedEvents();
  }
} 