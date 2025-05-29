import { injectable, inject } from 'inversify';
import type { ICommandHandler } from '../../../../core/mediator/ICommandHandler';
import type { CreateTrackCommand } from '../commands/CreateTrackCommand';
import type { TrackRepository } from '../../domain/repositories/TrackRepository';
import type { UndoRedoService } from '../services/UndoRedoService';
import { Track } from '../../domain/aggregates/Track';
import { TrackId } from '../../domain/value-objects/TrackId';
import { TrackMetadata } from '../../domain/value-objects/TrackMetadata';
import type { PeerId } from '../../domain/events/TrackEvents';
import { MusicArrangementTypes } from '../../di/MusicArrangementTypes';
import { DomainError } from '../../domain/errors/DomainError';
import { UndoableEvent } from '../../domain/events/MidiEvents';

@injectable()
export class CreateTrackCommandHandler implements ICommandHandler<CreateTrackCommand, string> {
  constructor(
    @inject(MusicArrangementTypes.TrackRepository)
    private readonly trackRepository: TrackRepository,
    @inject(MusicArrangementTypes.UndoRedoService)
    private readonly undoRedoService: UndoRedoService
  ) {}

  async handle(command: CreateTrackCommand): Promise<string> {
    try {
      // Generate new track ID
      const trackId = TrackId.create();
      
      // Create owner ID (simple implementation)
      const ownerId: PeerId = {
        toString: () => command.ownerId,
        equals: (other: PeerId) => other.toString() === command.ownerId
      };
      
      // Create track metadata
      const metadata = TrackMetadata.create(command.name);

      // Create track (this will raise TrackCreatedEvent)
      const track = Track.create(trackId, ownerId, command.trackType, metadata);

      // Get uncommitted events before saving
      const uncommittedEvents = track.getUncommittedEvents();

      // Save track (repository will clear uncommitted events)
      await this.trackRepository.save(track);

      // Record undoable events for undo/redo
      for (const event of uncommittedEvents) {
        if (this.isUndoableEvent(event)) {
          const trackVersion = await this.getTrackVersion(trackId);
          await this.undoRedoService.recordUndoableEvent(
            event as UndoableEvent,
            trackId.toString(),
            trackVersion,
            command.userId
          );
        }
      }

      return trackId.toString();
    } catch (error) {
      if (error instanceof Error) {
        throw DomainError.operationNotPermitted('createTrack', error.message);
      }
      throw error;
    }
  }

  private isUndoableEvent(event: any): event is UndoableEvent {
    return typeof event.createUndoEvent === 'function';
  }

  private async getTrackVersion(trackId: TrackId): Promise<number> {
    // Get current version from repository
    if ('getTrackVersion' in this.trackRepository) {
      return await (this.trackRepository as any).getTrackVersion(trackId);
    }
    // Fallback: get events and count them
    const events = await (this.trackRepository as any).eventStore?.getEventsForAggregate(trackId.toString()) || [];
    return events.length;
  }
} 