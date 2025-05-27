import { injectable, inject } from 'inversify';
import type { ICommandHandler } from '../../../../core/mediator/ICommandHandler';
import type { QuantizeMidiClipCommand } from '../commands/QuantizeMidiClipCommand';
import type { TrackRepository } from '../../domain/repositories/TrackRepository';
import { MusicArrangementTypes } from '../../di/MusicArrangementTypes';

@injectable()
export class QuantizeMidiClipCommandHandler implements ICommandHandler<QuantizeMidiClipCommand, void> {
  constructor(
    @inject(MusicArrangementTypes.TrackRepository)
    private readonly trackRepository: TrackRepository
  ) {}

  async handle(command: QuantizeMidiClipCommand): Promise<void> {
    const track = await this.trackRepository.loadWithClips(command.trackId);
    if (!track) {
      throw new Error(`Track not found: ${command.trackId.value}`);
    }

    track.quantizeMidiClip(command.clipId, command.quantizeValue);

    await this.trackRepository.saveWithClips(track);

    // Publish domain events
    const events = track.getUncommittedEvents();
    events.forEach(event => {
      console.log('Domain event:', event);
    });
    track.clearUncommittedEvents();
  }
} 