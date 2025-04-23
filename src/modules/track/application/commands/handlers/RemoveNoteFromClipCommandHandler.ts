import { injectable, inject } from 'inversify';
import { TrackTypes } from '../../../di/TrackTypes';
import { RemoveNoteFromClipCommand } from '../RemoveNoteFromClipCommand';
import type { IClipRepository } from '../../../domain/repositories/IClipRepository';
import type { IEventBus } from '../../../../../core/event-bus/IEventBus';
import { MidiClip } from '../../../domain/entities/clips/MidiClip';
import { NoteRemovedFromClipEvent } from '../../../domain/events/NoteRemovedFromClipEvent';

@injectable()
export class RemoveNoteFromClipCommandHandler {
  constructor(
    @inject(TrackTypes.ClipRepository) private repository: IClipRepository,
    @inject(TrackTypes.EventBus) private eventBus: IEventBus
  ) {}

  async handle(command: RemoveNoteFromClipCommand): Promise<void> {
    const clip = await this.repository.findById(command.clipId);
    if (!clip) {
      throw new Error(`Clip with id ${command.clipId} not found`);
    }

    if (!(clip instanceof MidiClip)) {
      throw new Error('Notes can only be removed from MIDI clips');
    }

    clip.removeNote(command.noteIndex);
    await this.repository.save(clip);

    const event = new NoteRemovedFromClipEvent(command.clipId, command.noteIndex);
    await this.eventBus.publish(event);
  }
} 