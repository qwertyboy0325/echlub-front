import { injectable, inject } from 'inversify';
import { TYPES } from '../../../../core/di/types';
import type { IEventBus } from '../../../../core/event-bus/IEventBus';
import type { IStateManager } from '../../../../core/state/IStateManager';
import { TrackId } from '../../domain/value-objects/TrackId';
import { TrackCreatedEvent } from '../../domain/events/TrackCreatedEvent';
import { TrackUpdatedEvent } from '../../domain/events/TrackUpdatedEvent';
import { TrackDeletedEvent } from '../../domain/events/TrackDeletedEvent';
import { BaseTrack } from '../../domain/entities/BaseTrack';
import { TrackFactory } from '../../domain/factories/TrackFactory';
import { TrackTypes } from '../../di/TrackTypes';

@injectable()
export class TrackStateService {
  constructor(
    @inject(TYPES.EventBus) private eventBus: IEventBus,
    @inject(TYPES.StateManager) private stateManager: IStateManager,
    @inject(TrackTypes.TrackFactory) private trackFactory: TrackFactory
  ) {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.eventBus.on('track:created', (event: TrackCreatedEvent) => this.handleTrackCreated(event));
    this.eventBus.on('track:updated', (event: TrackUpdatedEvent) => this.handleTrackUpdated(event));
    this.eventBus.on('track:deleted', (event: TrackDeletedEvent) => this.handleTrackDeleted(event));
  }

  public async handleTrackCreated(event: TrackCreatedEvent): Promise<void> {
    const track = this.trackFactory.createTrack(event.trackId, event.name, event.type);
    await this.stateManager.updateState('tracks', {
      [event.trackId.toString()]: track
    });
  }

  public async handleTrackUpdated(event: TrackUpdatedEvent): Promise<void> {
    const currentState = this.stateManager.getState<Record<string, BaseTrack>>('tracks') || {};
    const currentTrack = currentState[event.trackId.toString()];

    if (currentTrack) {
      await this.stateManager.updateState('tracks', {
        [event.trackId.toString()]: {
          ...currentTrack,
          ...event.changes
        }
      });
    }
  }

  public async handleTrackDeleted(event: TrackDeletedEvent): Promise<void> {
    const currentState = this.stateManager.getState<Record<string, BaseTrack>>('tracks') || {};
    const { [event.trackId.toString()]: _, ...newState } = currentState;

    await this.stateManager.updateState('tracks', newState);
  }

  public getTrackById(trackId: TrackId): BaseTrack | undefined {
    const state = this.stateManager.getState<Record<string, BaseTrack>>('tracks') || {};
    return state[trackId.toString()];
  }

  getAllTracks(): BaseTrack[] {
    const state = this.stateManager.getState<Record<string, BaseTrack>>('tracks') || {};
    return Object.values(state) as BaseTrack[];
  }

  getMutedTracks(): BaseTrack[] {
    const state = this.stateManager.getState<Record<string, BaseTrack>>('tracks') || {};
    return Object.values(state).filter((track): track is BaseTrack => track.isMuted());
  }

  getSoloTracks(): BaseTrack[] {
    const state = this.stateManager.getState<Record<string, BaseTrack>>('tracks') || {};
    return Object.values(state).filter((track): track is BaseTrack => track.isSolo());
  }
} 