import { injectable, inject } from 'inversify';
import type { IQueryHandler } from '../../../../core/mediator/IQueryHandler';
import type { GetTracksInTimeRangeQuery } from '../queries/GetTracksInTimeRangeQuery';
import type { Track } from '../../domain/aggregates/Track';
import type { TrackRepository } from '../../domain/repositories/TrackRepository';
import { MusicArrangementTypes } from '../../di/MusicArrangementTypes';

@injectable()
export class GetTracksInTimeRangeQueryHandler implements IQueryHandler<GetTracksInTimeRangeQuery, Track[]> {
  constructor(
    @inject(MusicArrangementTypes.TrackRepository)
    private readonly trackRepository: TrackRepository
  ) {}

  async handle(query: GetTracksInTimeRangeQuery): Promise<Track[]> {
    const tracks = await this.trackRepository.findByOwnerId(query.ownerId as any); // PeerId conversion
    
    // Filter tracks that have clips in the specified time range
    const tracksWithClips = await Promise.all(
      tracks.map(async (track) => {
        const trackWithClips = await this.trackRepository.loadWithClips(track.trackId);
        return trackWithClips;
      })
    );

    return tracksWithClips
      .filter((track): track is Track => track !== null)
      .filter(track => track.getClipsInRange(query.timeRange).length > 0);
  }
} 