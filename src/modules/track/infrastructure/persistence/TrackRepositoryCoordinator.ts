import { injectable, inject } from 'inversify';
import type { ITrackRepository, ILocalTrackRepository } from '../../domain/repositories/ITrackRepository';
import { BaseTrack } from '../../domain/entities/BaseTrack';
import { TrackId } from '../../domain/value-objects/TrackId';
import { TrackTypes } from '../../di/TrackTypes';
import { TYPES } from '../../../../core/di/types';
import type { IEventBus } from '../../../../core/event-bus/IEventBus';
import { TrackCreatedEvent } from '../../domain/events/TrackCreatedEvent';
import { TrackUpdatedEvent } from '../../domain/events/TrackUpdatedEvent';
import { TrackDeletedEvent } from '../../domain/events/TrackDeletedEvent';

@injectable()
export class TrackRepositoryCoordinator implements ITrackRepository {
  constructor(
    @inject(TrackTypes.LocalTrackRepository) 
    private localRepo: ILocalTrackRepository,
    @inject(TYPES.EventBus) 
    private eventBus: IEventBus
  ) {}

  async create(track: BaseTrack): Promise<void> {
    try {
      await this.localRepo.create(track);
      await this.eventBus.publish(new TrackCreatedEvent(track.getTrackId(), track.getName(), track.getType() as 'audio' | 'instrument' | 'bus'));
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
      await this.eventBus.publish(new TrackUpdatedEvent(track.getTrackId(), track));
    } catch (error) {
      throw new Error(`Failed to save track: ${error}`);
    }
  }

  async delete(id: TrackId): Promise<void> {
    try {
      await this.localRepo.delete(id);
      await this.eventBus.publish(new TrackDeletedEvent(id));
    } catch (error) {
      throw new Error(`Failed to delete track: ${error}`);
    }
  }
} 