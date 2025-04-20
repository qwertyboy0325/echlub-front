import { injectable, inject } from 'inversify';
import { ClipTypes } from '../../di/ClipTypes';
import { CreateMidiClipCommand } from '../commands/midi/CreateMidiClipCommand';
import type { IClipRepository } from '../../domain/repositories/IClipRepository';
import { MidiClipCreatedEvent } from '../../domain/events/ClipEvents';
import { ClipId } from '../../domain/value-objects/ClipId';
import { MidiClip } from '../../domain/entities/MidiClip';
import type { IEventBus } from '../../../../core/event-bus/IEventBus';

@injectable()
export class CreateMidiClipCommandHandler {
  constructor(
    @inject(ClipTypes.ClipRepository) private repository: IClipRepository,
    @inject(ClipTypes.EventBus) private eventBus: IEventBus
  ) {}

  async handle(command: CreateMidiClipCommand): Promise<ClipId> {
    const clipId = ClipId.create();
    const clip = new MidiClip(
      clipId,
      command.startTime,
      command.duration,
      [], // empty notes array
      1.0 // default gain
    );
    
    if (command.timeSignature) {
      clip.setTimeSignature(command.timeSignature);
    }
    
    await this.repository.save(clip);
    
    const event = new MidiClipCreatedEvent(
      clipId,
      command.startTime,
      command.duration,
      command.timeSignature
    );
    await this.eventBus.publish(event);
    
    return clipId;
  }
} 