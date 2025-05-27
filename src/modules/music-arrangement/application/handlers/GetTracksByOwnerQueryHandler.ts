import type { IQueryHandler } from '../../../../core/mediator/IQueryHandler';
import type { GetTracksByOwnerQuery } from '../queries/GetTracksByOwnerQuery';
import type { Track } from '../../domain/aggregates/Track';
import type { TrackRepository } from '../../domain/repositories/TrackRepository';
import { PeerId } from '../../../collaboration/domain/value-objects/PeerId';

export class GetTracksByOwnerQueryHandler implements IQueryHandler<GetTracksByOwnerQuery, Track[]> {
  constructor(
    private readonly trackRepository: TrackRepository
  ) {}

  async handle(query: GetTracksByOwnerQuery): Promise<Track[]> {
    // Convert string to PeerId if needed
    const ownerId = typeof query.ownerId === 'string' 
      ? PeerId.fromString(query.ownerId)
      : query.ownerId;
      
    return await this.trackRepository.findByOwnerId(ownerId);
  }
} 