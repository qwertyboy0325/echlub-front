import type { IQueryHandler } from '../../../../core/mediator/IQueryHandler';
import type { GetTracksInTimeRangeQuery } from '../queries/GetTracksInTimeRangeQuery';
import type { Track } from '../../domain/aggregates/Track';
import type { TrackRepository } from '../../domain/repositories/TrackRepository';
import { PeerId } from '../../../collaboration/domain/value-objects/PeerId';

export class GetTracksInTimeRangeQueryHandler implements IQueryHandler<GetTracksInTimeRangeQuery, Track[]> {
  constructor(
    private readonly trackRepository: TrackRepository
  ) {}

  async handle(query: GetTracksInTimeRangeQuery): Promise<Track[]> {
    // Convert string to PeerId if needed
    const ownerId = typeof query.ownerId === 'string' 
      ? PeerId.fromString(query.ownerId)
      : query.ownerId;
      
    const tracks = await this.trackRepository.findByOwnerId(ownerId);
    
    // Filter tracks that have clips in the specified time range
    return tracks.filter(track => {
      const clips = Array.from(track.clips.values());
      return clips.some(clip => 
        clip.range.intersects(query.timeRange)
      );
    });
  }
} 