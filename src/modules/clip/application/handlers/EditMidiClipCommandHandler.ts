import { injectable, inject } from 'inversify';
import { ClipTypes } from '../../di/ClipTypes';
import { EditMidiClipCommand } from '../commands/ClipCommands';
import type { IClipRepository } from '../../domain/repositories/IClipRepository';
import { MidiClipEditedEvent } from '../../domain/events/ClipEvents';
import { MidiClip, MidiNote } from '../../domain/entities/MidiClip';
import type { IEventBus } from '../../../../core/event-bus/IEventBus';

@injectable()
export class EditMidiClipCommandHandler {
  constructor(
    @inject(ClipTypes.ClipRepository) private repository: IClipRepository,
    @inject(ClipTypes.EventBus) private eventBus: IEventBus
  ) {}

  async handle(command: EditMidiClipCommand): Promise<void> {
    const clip = await this.repository.findById(command.clipId);
    if (!clip) {
      throw new Error(`MIDI clip not found: ${command.clipId.toString()}`);
    }

    if (!(clip instanceof MidiClip)) {
      throw new Error(`Clip ${command.clipId.toString()} is not a MIDI clip`);
    }

    const { changes } = command;
    
    // 應用更改
    if (changes.notes) {
      // 清除現有音符並添加新音符
      clip.getNotes().forEach(note => clip.removeNote(note.id));
      changes.notes.forEach(noteData => {
        const note = new MidiNote(
          crypto.randomUUID(),
          noteData.getPitch(),
          noteData.getVelocity(),
          noteData.getStartTime(),
          noteData.getDuration()
        );
        clip.addNote(note);
      });
    }
    
    if (changes.events) {
      // 清除現有事件並添加新事件
      clip.getEvents().forEach(event => clip.removeEvent(event));
      changes.events.forEach(event => clip.addEvent(event));
    }
    
    if (changes.timeSignature) {
      clip.setTimeSignature(changes.timeSignature);
    }
    
    if (changes.velocity !== undefined) {
      clip.setVelocity(changes.velocity);
    }

    // 保存更改
    await this.repository.save(clip);

    // 發布事件
    const event = new MidiClipEditedEvent(command.clipId, changes);
    await this.eventBus.publish(event);
  }
} 