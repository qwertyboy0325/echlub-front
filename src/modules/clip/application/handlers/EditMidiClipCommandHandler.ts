import { injectable, inject } from 'inversify';
import { ClipTypes } from '../../di/ClipTypes';
import { EditMidiClipCommand } from '../commands/midi/EditMidiClipCommand';
import type { IClipRepository } from '../../domain/repositories/IClipRepository';
import { MidiClipEditedEvent } from '../../domain/events/ClipEvents';
import { MidiClip } from '../../domain/entities/MidiClip';
import type { IEventBus } from '../../../../core/event-bus/IEventBus';
import { ClipOperationError } from '../../domain/errors/ClipError';

@injectable()
export class EditMidiClipCommandHandler {
  constructor(
    @inject(ClipTypes.ClipRepository) private repository: IClipRepository,
    @inject(ClipTypes.EventBus) private eventBus: IEventBus
  ) {}

  async handle(command: EditMidiClipCommand): Promise<void> {
    const clip = await this.repository.findById(command.clipId);
    if (!clip || !(clip instanceof MidiClip)) {
      throw new ClipOperationError('MIDI clip not found');
    }

    if (command.changes.notes) {
      // 清除現有音符
      const currentNotes = clip.getNotes();
      currentNotes.forEach(note => clip.removeNote(note.getId()));

      // 添加新音符
      command.changes.notes.forEach(note => {
        clip.addNote(note);
      });
    }

    if (command.changes.events) {
      command.changes.events.forEach(event => {
        clip.addEvent(event);
      });
    }

    if (command.changes.timeSignature) {
      clip.setTimeSignature(command.changes.timeSignature);
    }

    if (command.changes.velocity !== undefined) {
      clip.setVelocity(command.changes.velocity);
    }

    await this.repository.save(clip);
    await this.eventBus.publish(new MidiClipEditedEvent(command.clipId, command.changes));
  }
} 