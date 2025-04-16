import { injectable, inject } from 'inversify';
import { TrackTypes } from '../../di/TrackTypes';
import type { IEventBus } from '../../../../core/event-bus/IEventBus';
import type { IStateManager } from '../../../../core/state/IStateManager';
import { TrackCreatedEvent } from '../../domain/events/TrackCreatedEvent';
import { TrackRenamedEvent } from '../../domain/events/TrackRenamedEvent';
import { ClipAddedToTrackEvent } from '../../domain/events/ClipAddedToTrackEvent';
import { ClipRemovedFromTrackEvent } from '../../domain/events/ClipRemovedFromTrackEvent';
import { TrackRoutingChangedEvent } from '../../domain/events/TrackRoutingChangedEvent';
import { PluginAddedToTrackEvent } from '../../domain/events/PluginAddedToTrackEvent';
import { PluginRemovedFromTrackEvent } from '../../domain/events/PluginRemovedFromTrackEvent';

@injectable()
export class TrackEventHandler {
  constructor(
    @inject(TrackTypes.EventBus) private eventBus: IEventBus,
    @inject(TrackTypes.StateManager) private stateManager: IStateManager
  ) {
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.eventBus.on('track:created', this.handleTrackCreated.bind(this));
    this.eventBus.on('track:renamed', this.handleTrackRenamed.bind(this));
    this.eventBus.on('clip:added', this.handleClipAdded.bind(this));
    this.eventBus.on('clip:removed', this.handleClipRemoved.bind(this));
    this.eventBus.on('track:routing:changed', this.handleRoutingChanged.bind(this));
    this.eventBus.on('plugin:added', this.handlePluginAdded.bind(this));
    this.eventBus.on('plugin:removed', this.handlePluginRemoved.bind(this));
  }

  private async handleTrackCreated(event: TrackCreatedEvent): Promise<void> {
    const state = this.stateManager.getState<Record<string, any>>('tracks') || {};
    state[event.trackId.toString()] = {
      id: event.trackId,
      name: event.name,
      type: event.type,
      plugins: [],
      routing: null
    };
    await this.stateManager.updateState('tracks', state);
  }

  private async handleTrackRenamed(event: TrackRenamedEvent): Promise<void> {
    const state = this.stateManager.getState<Record<string, any>>('tracks') || {};
    const track = state[event.trackId.toString()];
    if (track) {
      track.name = event.newName;
      await this.stateManager.updateState('tracks', state);
    }
  }

  private async handleClipAdded(event: ClipAddedToTrackEvent): Promise<void> {
    const state = this.stateManager.getState<Record<string, any>>('tracks') || {};
    const track = state[event.trackId.toString()];
    if (track) {
      if (!track.clips) {
        track.clips = [];
      }
      track.clips.push(event.clipId);
      await this.stateManager.updateState('tracks', state);
    }
  }

  private async handleClipRemoved(event: ClipRemovedFromTrackEvent): Promise<void> {
    const state = this.stateManager.getState<Record<string, any>>('tracks') || {};
    const track = state[event.trackId.toString()];
    if (track && track.clips) {
      track.clips = track.clips.filter((id: string) => id !== event.clipId.toString());
      await this.stateManager.updateState('tracks', state);
    }
  }

  private async handleRoutingChanged(event: TrackRoutingChangedEvent): Promise<void> {
    const state = this.stateManager.getState<Record<string, any>>('tracks') || {};
    const track = state[event.trackId.toString()];
    if (track) {
      track.routing = event.routing;
      await this.stateManager.updateState('tracks', state);
    }
  }

  private async handlePluginAdded(event: PluginAddedToTrackEvent): Promise<void> {
    const state = this.stateManager.getState<Record<string, any>>('tracks') || {};
    const track = state[event.trackId.toString()];
    if (track) {
      if (!track.plugins) {
        track.plugins = [];
      }
      track.plugins.push(event.pluginId);
      await this.stateManager.updateState('tracks', state);
    }
  }

  private async handlePluginRemoved(event: PluginRemovedFromTrackEvent): Promise<void> {
    const state = this.stateManager.getState<Record<string, any>>('tracks') || {};
    const track = state[event.trackId.toString()];
    if (track && track.plugins) {
      track.plugins = track.plugins.filter((id: string) => id !== event.pluginId.toString());
      await this.stateManager.updateState('tracks', state);
    }
  }
} 