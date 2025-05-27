import { injectable, inject } from 'inversify';
import type { ICommandHandler } from '../../../../core/mediator/ICommandHandler';
import type { CreateMidiClipCommand } from '../commands/CreateMidiClipCommand';
import type { ClipId } from '../../domain/value-objects/ClipId';
import type { TrackRepository } from '../../domain/repositories/TrackRepository';
import type { ClipRepository } from '../../domain/repositories/ClipRepository';
import { MidiClip } from '../../domain/entities/MidiClip';
import { MusicArrangementTypes } from '../../di/MusicArrangementTypes';

@injectable()
export class CreateMidiClipCommandHandler implements ICommandHandler<CreateMidiClipCommand, ClipId> {
  constructor(
    @inject(MusicArrangementTypes.TrackRepository)
    private readonly trackRepository: TrackRepository,
    @inject(MusicArrangementTypes.ClipRepository)
    private readonly clipRepository: ClipRepository
  ) {}

  async handle(command: CreateMidiClipCommand): Promise<ClipId> {
    const track = await this.trackRepository.findById(command.trackId);
    if (!track) {
      throw new Error(`Track not found: ${command.trackId.value}`);
    }

    const midiClip = MidiClip.create(
      command.range,
      command.instrument,
      command.metadata
    );

    track.addClip(midiClip);

    await this.trackRepository.saveWithClips(track);
    await this.clipRepository.save(midiClip);

    // Publish domain events
    const events = track.getUncommittedEvents();
    events.forEach(event => {
      console.log('Domain event:', event);
    });
    track.clearUncommittedEvents();

    return midiClip.clipId;
  }
} 