import { injectable, inject } from 'inversify';
import type { ITrackRepository, ILocalTrackRepository } from '../../domain/repositories/ITrackRepository';
import { BaseTrack } from '../../domain/entities/BaseTrack';
import { TrackId } from '../../domain/value-objects/track/TrackId';
import { TrackTypes } from '../../di/TrackTypes';
import type { ITrackEventPublisher } from '../../domain/ports/ITrackEventPublisher';

@injectable()
export class TrackRepositoryCoordinator implements ITrackRepository {
  constructor(
    @inject(TrackTypes.LocalTrackRepository) 
    private localRepo: ILocalTrackRepository,
    @inject(TrackTypes.TrackEventPublisher)
    private eventPublisher: ITrackEventPublisher
  ) {}

  async create(track: BaseTrack): Promise<void> {
    try {
      await this.localRepo.create(track);
      const trackType = track.getType().toString() as 'audio' | 'instrument' | 'bus';
      await this.eventPublisher.publishTrackCreated(
        track.getTrackId(),
        track.getName(),
        trackType
      );
    } catch (error) {
      throw new Error(`Failed to create track: ${error}`);
    }
  }

  async findById(id: TrackId): Promise<BaseTrack | undefined> {
    return this.localRepo.findById(id);
  }

  async save(track: BaseTrack): Promise<void> {
    try {
      await this.localRepo.save(track);
      await this.eventPublisher.publishTrackUpdated(track.getTrackId(), track);
    } catch (error) {
      throw new Error(`Failed to save track: ${error}`);
    }
  }

  async delete(id: TrackId): Promise<void> {
    try {
      await this.localRepo.delete(id);
      await this.eventPublisher.publishTrackDeleted(id);
    } catch (error) {
      throw new Error(`Failed to delete track: ${error}`);
    }
  }
} 