import { injectable, inject } from 'inversify';
import { TrackTypes } from '../../di/TrackTypes';
import type { ITrackRepository } from '../../domain/repositories/ITrackRepository';
import { BaseTrack } from '../../domain/entities/BaseTrack';
import { TrackId } from '../../domain/value-objects/TrackId';
import type { IStateManager } from '../../../../core/state/IStateManager';

@injectable()
export class TrackRepositoryImpl implements ITrackRepository {
  constructor(
    @inject(TrackTypes.StateManager) private stateManager: IStateManager
  ) {}

  async save(track: BaseTrack): Promise<void> {
    const state = this.stateManager.getState<Record<string, BaseTrack>>('tracks') || {};
    state[track.getTrackId().toString()] = track;
    await this.stateManager.updateState('tracks', state);
  }

  async findById(trackId: TrackId): Promise<BaseTrack | undefined> {
    const state = this.stateManager.getState<Record<string, BaseTrack>>('tracks') || {};
    return state[trackId.toString()];
  }

  async delete(trackId: TrackId): Promise<void> {
    const state = this.stateManager.getState<Record<string, BaseTrack>>('tracks') || {};
    delete state[trackId.toString()];
    await this.stateManager.updateState('tracks', state);
  }

  async create(track: BaseTrack): Promise<void> {
    await this.save(track);
  }
} 