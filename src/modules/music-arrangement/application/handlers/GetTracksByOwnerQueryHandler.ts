import { injectable, inject } from 'inversify';
import type { IQueryHandler } from '../../../../core/mediator/IQueryHandler';
import type { GetTracksByOwnerQuery } from '../queries/GetTracksByOwnerQuery';
import type { Track } from '../../domain/aggregates/Track';
import type { TrackRepository } from '../../domain/repositories/TrackRepository';
import { MusicArrangementTypes } from '../../di/MusicArrangementTypes';

@injectable()
export class GetTracksByOwnerQueryHandler implements IQueryHandler<GetTracksByOwnerQuery, Track[]> {
  constructor(
    @inject(MusicArrangementTypes.TrackRepository)
    private readonly trackRepository: TrackRepository
  ) {}

  async handle(query: GetTracksByOwnerQuery): Promise<Track[]> {
    return await this.trackRepository.findByOwnerId(query.ownerId as any); // PeerId conversion
  }
} 