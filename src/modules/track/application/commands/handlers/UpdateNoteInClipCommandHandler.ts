import { injectable, inject } from 'inversify';
import { TrackTypes } from '../../../di/TrackTypes';
import { UpdateNoteInClipCommand } from '../UpdateNoteInClipCommand';
import type { IClipRepository } from '../../../domain/repositories/IClipRepository';
import type { IEventBus } from '../../../../../core/event-bus/IEventBus';
import { MidiClip } from '../../../domain/entities/clips/MidiClip';
import { MidiNote } from '../../../domain/value-objects/note/MidiNote';
import { NoteUpdatedInClipEvent } from '../../../domain/events/NoteUpdatedInClipEvent';

@injectable()
export class UpdateNoteInClipCommandHandler {
  constructor(
    @inject(TrackTypes.ClipRepository) private repository: IClipRepository,
    @inject(TrackTypes.EventBus) private eventBus: IEventBus
  ) {}

  async handle(command: UpdateNoteInClipCommand): Promise<void> {
    const clip = await this.repository.findById(command.clipId);
    if (!clip) {
      throw new Error(`Clip with id ${command.clipId} not found`);
    }

    if (!(clip instanceof MidiClip)) {
      throw new Error('Notes can only be updated in MIDI clips');
    }

    const note = MidiNote.create(command.noteProps);
    clip.updateNote(command.noteIndex, note);
    await this.repository.save(clip);

    const event = new NoteUpdatedInClipEvent(command.clipId, command.noteIndex, note);
    await this.eventBus.publish(event);
  }
} 