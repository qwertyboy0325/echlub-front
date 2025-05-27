import { injectable, inject } from 'inversify';
import type { ICommandHandler } from '../../../../core/mediator/ICommandHandler';
import type { CreateTrackCommand } from '../commands/CreateTrackCommand';
import type { TrackId } from '../../domain/value-objects/TrackId';
import type { TrackRepository } from '../../domain/repositories/TrackRepository';
import { Track } from '../../domain/aggregates/Track';
import { TrackId as TrackIdImpl } from '../../domain/value-objects/TrackId';
import { PeerId } from '../../../collaboration/domain/value-objects/PeerId';
import { MusicArrangementTypes } from '../../di/MusicArrangementTypes';

@injectable()
export class CreateTrackCommandHandler implements ICommandHandler<CreateTrackCommand, TrackId> {
  constructor(
    @inject(MusicArrangementTypes.TrackRepository)
    private readonly trackRepository: TrackRepository
  ) {}

  async handle(command: CreateTrackCommand): Promise<TrackId> {
    const trackId = TrackIdImpl.create();
    
    // Convert string to PeerId if needed
    const ownerId = typeof command.ownerId === 'string' 
      ? PeerId.fromString(command.ownerId)
      : command.ownerId;
    
    const track = Track.create(
      trackId,
      ownerId,
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