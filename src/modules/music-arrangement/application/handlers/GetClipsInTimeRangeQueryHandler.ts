import { injectable, inject } from 'inversify';
import type { IQueryHandler } from '../../../../core/mediator/IQueryHandler';
import type { GetClipsInTimeRangeQuery } from '../queries/GetClipsInTimeRangeQuery';
import type { Clip } from '../../domain/entities/Clip';
import type { TrackRepository } from '../../domain/repositories/TrackRepository';
import { MusicArrangementTypes } from '../../di/MusicArrangementTypes';

@injectable()
export class GetClipsInTimeRangeQueryHandler implements IQueryHandler<GetClipsInTimeRangeQuery, Clip[]> {
  constructor(
    @inject(MusicArrangementTypes.TrackRepository)
    private readonly trackRepository: TrackRepository
  ) {}

  async handle(query: GetClipsInTimeRangeQuery): Promise<Clip[]> {
    const track = await this.trackRepository.loadWithClips(query.trackId);
    if (!track) {
      return [];
    }

    return track.getClipsInRange(query.timeRange);
  }
} 