import { injectable, inject } from 'inversify';
import type { ICommandHandler } from '../../../../core/mediator/ICommandHandler';
import type { AddMidiNoteCommand } from '../commands/AddMidiNoteCommand';
import type { MidiNoteId } from '../../domain/value-objects/MidiNoteId';
import type { TrackRepository } from '../../domain/repositories/TrackRepository';
import { MidiNote } from '../../domain/entities/MidiNote';
import { MusicArrangementTypes } from '../../di/MusicArrangementTypes';

@injectable()
export class AddMidiNoteCommandHandler implements ICommandHandler<AddMidiNoteCommand, MidiNoteId> {
  constructor(
    @inject(MusicArrangementTypes.TrackRepository)
    private readonly trackRepository: TrackRepository
  ) {}

  async handle(command: AddMidiNoteCommand): Promise<MidiNoteId> {
    const track = await this.trackRepository.loadWithClips(command.trackId);
    if (!track) {
      throw new Error(`Track not found: ${command.trackId.value}`);
    }

    const note = MidiNote.create(
      command.pitch,
      command.velocity,
      command.range
    );

    track.addMidiNoteToClip(command.clipId, note);

    await this.trackRepository.saveWithClips(track);

    // Publish domain events
    const events = track.getUncommittedEvents();
    events.forEach(event => {
      console.log('Domain event:', event);
    });
    track.clearUncommittedEvents();

    return note.noteId;
  }
} 