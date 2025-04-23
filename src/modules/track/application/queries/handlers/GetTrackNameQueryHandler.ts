import { injectable, inject } from 'inversify';
import { TrackTypes } from '../../../di/TrackTypes';
import { GetTrackNameQuery } from '../GetTrackNameQuery';
import type { ITrackRepository } from '../../../domain/repositories/ITrackRepository';
import { TrackOperationError } from '../../../domain/errors/TrackError';

@injectable()
export class GetTrackNameQueryHandler {
  constructor(
    @inject(TrackTypes.TrackRepository) private repository: ITrackRepository
  ) {}

  async handle(query: GetTrackNameQuery): Promise<string> {
    const track = await this.repository.findById(query.trackId);
    if (!track) {
      throw new TrackOperationError('Track not found');
    }
    return track.getName();
  }
} 