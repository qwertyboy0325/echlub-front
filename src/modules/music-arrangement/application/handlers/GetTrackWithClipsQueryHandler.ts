import { injectable, inject } from 'inversify';
import type { IQueryHandler } from '../../../../core/mediator/IQueryHandler';
import type { GetTrackWithClipsQuery } from '../queries/GetTrackWithClipsQuery';
import type { Track } from '../../domain/aggregates/Track';
import type { TrackRepository } from '../../domain/repositories/TrackRepository';
import { MusicArrangementTypes } from '../../di/MusicArrangementTypes';

@injectable()
export class GetTrackWithClipsQueryHandler implements IQueryHandler<GetTrackWithClipsQuery, Track | null> {
  constructor(
    @inject(MusicArrangementTypes.TrackRepository)
    private readonly trackRepository: TrackRepository
  ) {}

  async handle(query: GetTrackWithClipsQuery): Promise<Track | null> {
    return await this.trackRepository.loadWithClips(query.trackId);
  }
} 