import { injectable, inject } from 'inversify';
import { TYPES } from '../../../../core/di/types';
import type { IEventBus } from '../../../../core/event-bus/IEventBus';
import { TrackCreatedEvent } from '../../domain/events/TrackCreatedEvent';
import { TrackRenamedEvent } from '../../domain/events/TrackRenamedEvent';
import { ClipAddedToTrackEvent } from '../../domain/events/ClipAddedToTrackEvent';
import { ClipRemovedFromTrackEvent } from '../../domain/events/ClipRemovedFromTrackEvent';
import { TrackRoutingChangedEvent } from '../../domain/events/TrackRoutingChangedEvent';
import { PluginAddedToTrackEvent } from '../../domain/events/PluginAddedToTrackEvent';
import { PluginRemovedFromTrackEvent } from '../../domain/events/PluginRemovedFromTrackEvent';

@injectable()
export class TrackEventPublisher {
  constructor(
    @inject(TYPES.EventBus) private eventBus: IEventBus
  ) {}

  async publishTrackCreated(event: TrackCreatedEvent): Promise<void> {
    await this.eventBus.emit('track:created', event);
  }

  async publishTrackRenamed(event: TrackRenamedEvent): Promise<void> {
    await this.eventBus.emit('track:renamed', event);
  }

  async publishClipAdded(event: ClipAddedToTrackEvent): Promise<void> {
    await this.eventBus.emit('clip:added', event);
  }

  async publishClipRemoved(event: ClipRemovedFromTrackEvent): Promise<void> {
    await this.eventBus.emit('clip:removed', event);
  }

  async publishRoutingChanged(event: TrackRoutingChangedEvent): Promise<void> {
    await this.eventBus.emit('track:routing:changed', event);
  }

  async publishPluginAdded(event: PluginAddedToTrackEvent): Promise<void> {
    await this.eventBus.emit('plugin:added', event);
  }

  async publishPluginRemoved(event: PluginRemovedFromTrackEvent): Promise<void> {
    await this.eventBus.emit('plugin:removed', event);
  }
} 