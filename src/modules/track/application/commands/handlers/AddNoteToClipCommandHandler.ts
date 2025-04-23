import { injectable, inject } from 'inversify';
import { TrackTypes } from '../../../di/TrackTypes';
import { AddNoteToClipCommand } from '../AddNoteToClipCommand';
import type { IClipRepository } from '../../../domain/repositories/IClipRepository';
import type { IEventBus } from '../../../../../core/event-bus/IEventBus';
import { MidiClip } from '../../../domain/entities/clips/MidiClip';
import { MidiNote } from '../../../domain/value-objects/note/MidiNote';
import { NoteAddedToClipEvent } from '../../../domain/events/NoteAddedToClipEvent';

@injectable()
export class AddNoteToClipCommandHandler {
  constructor(
    @inject(TrackTypes.ClipRepository) private repository: IClipRepository,
    @inject(TrackTypes.EventBus) private eventBus: IEventBus
  ) {}

  async handle(command: AddNoteToClipCommand): Promise<void> {
    const clip = await this.repository.findById(command.clipId);
    if (!clip) {
      throw new Error(`Clip with id ${command.clipId} not found`);
    }

    if (!(clip instanceof MidiClip)) {
      throw new Error('Notes can only be added to MIDI clips');
    }

    const note = MidiNote.create(command.noteProps);
    clip.addNote(note);
    await this.repository.save(clip);

    const event = new NoteAddedToClipEvent(command.clipId, note);
    await this.eventBus.publish(event);
  }
} 