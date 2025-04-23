import { injectable, inject } from 'inversify';
import { TrackTypes } from '../../../di/TrackTypes';
import { CreateClipInTrackCommand } from '../CreateClipInTrackCommand';
import type { ITrackRepository } from '../../../domain/repositories/ITrackRepository';
import type { IClipRepository } from '../../../domain/repositories/IClipRepository';
import type { IEventBus } from '../../../../../core/event-bus/IEventBus';
import { ClipCreatedEvent } from '../../../domain/events/ClipCreatedEvent';
import { ClipAddedToTrackEvent } from '../../../domain/events/ClipAddedToTrackEvent';
import { InvalidTrackTypeError } from '../../../domain/errors/InvalidTrackTypeError';
import { AudioTrack } from '../../../domain/entities/AudioTrack';
import { MidiTrack } from '../../../domain/entities/MidiTrack';
import { AudioClip } from '../../../domain/entities/clips/AudioClip';
import { MidiClip } from '../../../domain/entities/clips/MidiClip';
import { ClipId } from '../../../domain/value-objects/clips/ClipId';

@injectable()
export class CreateClipInTrackCommandHandler {
  constructor(
    @inject(TrackTypes.TrackRepository) private trackRepository: ITrackRepository,
    @inject(TrackTypes.ClipRepository) private clipRepository: IClipRepository,
    @inject(TrackTypes.EventBus) private eventBus: IEventBus
  ) {}

  async handle(command: CreateClipInTrackCommand): Promise<void> {
    const track = await this.trackRepository.findById(command.trackId);
    if (!track) {
      throw new Error(`Track with id ${command.trackId} not found`);
    }

    const clipId = ClipId.create();
    let clip;

    if (track instanceof AudioTrack) {
      if (!command.params.sampleId) {
        throw new Error('Sample ID is required for audio clips');
      }
      clip = new AudioClip(
        clipId,
        command.params.sampleId,
        command.params.startTime,
        command.params.duration,
        command.params.offset || 0
      );
    } else if (track instanceof MidiTrack) {
      if (!command.params.timeSignature) {
        throw new Error('Time signature is required for MIDI clips');
      }
      clip = new MidiClip(
        clipId,
        command.params.startTime,
        command.params.duration,
        [],
        command.params.timeSignature
      );
    } else {
      throw new InvalidTrackTypeError('Track type does not support clips');
    }

    await this.clipRepository.save(clip);
    track.addClip(clip.getId());
    await this.trackRepository.save(track);

    const clipType = track instanceof AudioTrack ? 'audio' : 'midi';
    await this.eventBus.publish(new ClipCreatedEvent(clipId, clip, clipType));
    await this.eventBus.publish(new ClipAddedToTrackEvent(command.trackId, clipId));
  }
} 