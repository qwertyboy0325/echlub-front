import { injectable, inject } from 'inversify';
import type { IQueryHandler } from '../../../../core/mediator/IQueryHandler';
import type { GetTrackByIdQuery } from '../queries/GetTrackByIdQuery';
import type { Track } from '../../domain/aggregates/Track';
import type { TrackRepository } from '../../domain/repositories/TrackRepository';
import { MusicArrangementTypes } from '../../di/MusicArrangementTypes';

@injectable()
export class GetTrackByIdQueryHandler implements IQueryHandler<GetTrackByIdQuery, Track | null> {
  constructor(
    @inject(MusicArrangementTypes.TrackRepository)
    private readonly trackRepository: TrackRepository
  ) {}

  async handle(query: GetTrackByIdQuery): Promise<Track | null> {
    return await this.trackRepository.findById(query.trackId);
  }
} 