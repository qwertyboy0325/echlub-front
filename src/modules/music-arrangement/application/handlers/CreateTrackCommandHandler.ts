import { injectable, inject } from 'inversify';
import type { ICommandHandler } from '../../../../core/mediator/ICommandHandler';
import type { CreateTrackCommand } from '../commands/CreateTrackCommand';
import type { TrackId } from '../../domain/value-objects/TrackId';
import type { TrackRepository } from '../../domain/repositories/TrackRepository';
import { Track } from '../../domain/aggregates/Track';
import { TrackId as TrackIdImpl } from '../../domain/value-objects/TrackId';
import { MusicArrangementTypes } from '../../di/MusicArrangementTypes';

@injectable()
export class CreateTrackCommandHandler implements ICommandHandler<CreateTrackCommand, TrackId> {
  constructor(
    @inject(MusicArrangementTypes.TrackRepository)
    private readonly trackRepository: TrackRepository
  ) {}

  async handle(command: CreateTrackCommand): Promise<TrackId> {
    const trackId = TrackIdImpl.create();
    
    const track = Track.create(
      trackId,
      command.ownerId as any, // PeerId conversion
      command.trackType,
      command.metadata
    );

    await this.trackRepository.save(track);

    // Publish domain events
    const events = track.getUncommittedEvents();
    events.forEach(event => {
      // Event publishing will be handled by the mediator or event bus
      console.log('Domain event:', event);
    });
    track.clearUncommittedEvents();

    return trackId;
  }
} 