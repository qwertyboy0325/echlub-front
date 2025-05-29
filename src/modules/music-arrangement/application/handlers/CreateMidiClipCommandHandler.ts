import { injectable, inject } from 'inversify';
import type { ICommandHandler } from '../../../../core/mediator/ICommandHandler';
import type { CreateMidiClipCommand } from '../commands/CreateMidiClipCommand';
import type { ClipId } from '../../domain/value-objects/ClipId';
import type { TrackRepository } from '../../domain/repositories/TrackRepository';
import type { ClipRepository } from '../../domain/repositories/ClipRepository';
import type { UndoRedoService } from '../services/UndoRedoService';
import { MidiClip } from '../../domain/entities/MidiClip';
import { MusicArrangementTypes } from '../../di/MusicArrangementTypes';
import { DomainError } from '../../domain/errors/DomainError';
import { UndoableEvent } from '../../domain/events/MidiEvents';

@injectable()
export class CreateMidiClipCommandHandler implements ICommandHandler<CreateMidiClipCommand, ClipId> {
  constructor(
    @inject(MusicArrangementTypes.TrackRepository)
    private readonly trackRepository: TrackRepository,
    @inject(MusicArrangementTypes.ClipRepository)
    private readonly clipRepository: ClipRepository,
    @inject(MusicArrangementTypes.UndoRedoService)
    private readonly undoRedoService: UndoRedoService
  ) {}

  async handle(command: CreateMidiClipCommand): Promise<ClipId> {
    // Load track
    const track = await this.trackRepository.loadWithClips(command.trackId);
    if (!track) {
      throw DomainError.trackNotFound(command.trackId.toString());
    }

    // Create MIDI clip
    const midiClip = MidiClip.create(
      command.range,
      command.instrument,
      command.metadata
    );

    // Add clip to track (this will raise domain events)
    track.addClip(midiClip);

    // Immediately add clip to state for subsequent operations
    track.addClipToState(midiClip);

    // Get uncommitted events before saving
    const uncommittedEvents = track.getUncommittedEvents();

    // Save track and clip
    await this.trackRepository.saveWithClips(track);
    await this.clipRepository.save(midiClip);

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

    return midiClip.clipId;
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