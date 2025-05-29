import { injectable, inject } from 'inversify';
import type { ICommandHandler } from '../../../../core/mediator/ICommandHandler';
import type { AddMidiNoteCommand } from '../commands/AddMidiNoteCommand';
import type { MidiNoteId } from '../../domain/value-objects/MidiNoteId';
import type { TrackRepository } from '../../domain/repositories/TrackRepository';
import type { UndoRedoService } from '../services/UndoRedoService';
import { MidiNote } from '../../domain/entities/MidiNote';
import { MusicArrangementTypes } from '../../di/MusicArrangementTypes';
import { DomainError } from '../../domain/errors/DomainError';
import { UndoableEvent } from '../../domain/events/MidiEvents';

@injectable()
export class AddMidiNoteCommandHandler implements ICommandHandler<AddMidiNoteCommand, MidiNoteId> {
  constructor(
    @inject(MusicArrangementTypes.TrackRepository)
    private readonly trackRepository: TrackRepository,
    @inject(MusicArrangementTypes.UndoRedoService)
    private readonly undoRedoService: UndoRedoService
  ) {}

  async handle(command: AddMidiNoteCommand): Promise<MidiNoteId> {
    // Load track with clips
    const track = await this.trackRepository.loadWithClips(command.trackId);
    if (!track) {
      throw DomainError.trackNotFound(command.trackId.toString());
    }

    // Create MIDI note
    const note = MidiNote.create(
      command.pitch,
      command.velocity,
      command.range
    );

    // Add note to clip (this will raise domain events)
    track.addMidiNoteToClip(command.clipId, note);

    // Get uncommitted events before saving
    const uncommittedEvents = track.getUncommittedEvents();

    // Save track (repository will clear uncommitted events)
    await this.trackRepository.saveWithClips(track);

    // Record undoable events for undo/redo
    for (const event of uncommittedEvents) {
      if (this.isUndoableEvent(event)) {
        const trackVersion = await this.getTrackVersion(command.trackId);
        await this.undoRedoService.recordUndoableEvent(
          event as UndoableEvent,
          command.trackId.toString(),
          trackVersion,
          command.userId
        );
      }
    }

    return note.noteId;
  }

  private isUndoableEvent(event: any): event is UndoableEvent {
    return typeof event.createUndoEvent === 'function';
  }

  private async getTrackVersion(trackId: any): Promise<number> {
    // Get current version from repository
    if ('getTrackVersion' in this.trackRepository) {
      return await (this.trackRepository as any).getTrackVersion(trackId);
    }
    // Fallback: get events and count them
    const events = await (this.trackRepository as any).eventStore?.getEventsForAggregate(trackId.toString()) || [];
    return events.length;
  }
} 