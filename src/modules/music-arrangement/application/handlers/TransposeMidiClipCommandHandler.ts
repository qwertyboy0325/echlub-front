import { injectable, inject } from 'inversify';
import type { ICommandHandler } from '../../../../core/mediator/ICommandHandler';
import type { TransposeMidiClipCommand } from '../commands/TransposeMidiClipCommand';
import type { TrackRepository } from '../../domain/repositories/TrackRepository';
import type { UndoRedoService } from '../services/UndoRedoService';
import { MusicArrangementTypes } from '../../di/MusicArrangementTypes';
import { DomainError } from '../../domain/errors/DomainError';
import { UndoableEvent } from '../../domain/events/MidiEvents';

@injectable()
export class TransposeMidiClipCommandHandler implements ICommandHandler<TransposeMidiClipCommand, void> {
  constructor(
    @inject(MusicArrangementTypes.TrackRepository)
    private readonly trackRepository: TrackRepository,
    @inject(MusicArrangementTypes.UndoRedoService)
    private readonly undoRedoService: UndoRedoService
  ) {}

  async handle(command: TransposeMidiClipCommand): Promise<void> {
    // Load track with clips
    const track = await this.trackRepository.loadWithClips(command.trackId);
    if (!track) {
      throw DomainError.trackNotFound(command.trackId.toString());
    }

    // Transpose MIDI clip (this will raise domain events)
    track.transposeMidiClip(command.clipId, command.semitones);

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