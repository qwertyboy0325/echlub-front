import { injectable, inject } from 'inversify';
import type { ICommandHandler } from '../../../../core/mediator/ICommandHandler';
import type { CreateAudioClipCommand } from '../commands/CreateAudioClipCommand';
import type { ClipId } from '../../domain/value-objects/ClipId';
import type { TrackRepository } from '../../domain/repositories/TrackRepository';
import type { ClipRepository } from '../../domain/repositories/ClipRepository';
import { AudioClip } from '../../domain/entities/AudioClip';
import { MusicArrangementTypes } from '../../di/MusicArrangementTypes';

@injectable()
export class CreateAudioClipCommandHandler implements ICommandHandler<CreateAudioClipCommand, ClipId> {
  constructor(
    @inject(MusicArrangementTypes.TrackRepository)
    private readonly trackRepository: TrackRepository,
    @inject(MusicArrangementTypes.ClipRepository)
    private readonly clipRepository: ClipRepository
  ) {}

  async handle(command: CreateAudioClipCommand): Promise<ClipId> {
    const track = await this.trackRepository.findById(command.trackId);
    if (!track) {
      throw new Error(`Track not found: ${command.trackId.value}`);
    }

    const audioClip = AudioClip.create(
      command.range,
      command.audioSource,
      command.metadata
    );

    // Apply the business rule and raise domain event
    track.addClip(audioClip);

    // In event sourcing, events are automatically applied when raised
    // But we need to manually add the clip to state for immediate availability
    track.addClipToState(audioClip);

    // Get and log domain events
    const events = track.getUncommittedEvents();
    events.forEach(event => {
      console.log('Domain event:', event);
    });
    
    // Clear events after processing
    track.clearUncommittedEvents();

    // Persist the changes
    await this.trackRepository.saveWithClips(track);
    await this.clipRepository.save(audioClip);

    return audioClip.clipId;
  }
} 