import { injectable, inject } from 'inversify';
import { TYPES } from '../../../../core/di/types';
import type { IEventBus } from '../../../../core/event-bus/IEventBus';
import { ITrackEventPublisher } from '../../domain/ports/ITrackEventPublisher';
import { TrackId } from '../../domain/value-objects/track/TrackId';
import { BaseTrack } from '../../domain/entities/BaseTrack';
import { TrackRouting } from '../../domain/value-objects/track/TrackRouting';
import { PluginInstanceId } from '../../../plugin/domain/value-objects/PluginInstanceId';
import { TrackCreatedEvent } from '../../domain/events/TrackCreatedEvent';
import { TrackUpdatedEvent } from '../../domain/events/TrackUpdatedEvent';
import { TrackDeletedEvent } from '../../domain/events/TrackDeletedEvent';
import { TrackRenamedEvent } from '../../domain/events/TrackRenamedEvent';
import { TrackRoutingChangedEvent } from '../../domain/events/TrackRoutingChangedEvent';
import { PluginAddedToTrackEvent } from '../../domain/events/PluginAddedToTrackEvent';
import { PluginRemovedFromTrackEvent } from '../../domain/events/PluginRemovedFromTrackEvent';
import { PluginReference } from '../../domain/value-objects/plugin/PluginReference';
import { TrackType } from '../../domain/value-objects/track/TrackType';

@injectable()
export class TrackEventBusAdapter implements ITrackEventPublisher {
  constructor(
    @inject(TYPES.EventBus) private eventBus: IEventBus
  ) {}

  async publishTrackCreated(trackId: TrackId, name: string, type: 'audio' | 'instrument' | 'bus'): Promise<void> {
    await this.eventBus.publish(new TrackCreatedEvent(trackId, name, TrackType.fromString(type)));
  }

  async publishTrackUpdated(trackId: TrackId, track: BaseTrack): Promise<void> {
    await this.eventBus.publish(new TrackUpdatedEvent(trackId, track));
  }

  async publishTrackDeleted(trackId: TrackId): Promise<void> {
    await this.eventBus.publish(new TrackDeletedEvent(trackId));
  }

  async publishTrackRenamed(trackId: TrackId, newName: string): Promise<void> {
    await this.eventBus.publish(new TrackRenamedEvent(trackId, newName));
  }

  async publishTrackRoutingChanged(trackId: TrackId, routing: TrackRouting): Promise<void> {
    await this.eventBus.publish(new TrackRoutingChangedEvent(trackId, routing));
  }

  async publishPluginAdded(trackId: TrackId, pluginId: PluginInstanceId): Promise<void> {
    await this.eventBus.publish(new PluginAddedToTrackEvent(trackId, pluginId));
  }

  async publishPluginRemoved(trackId: TrackId, pluginId: PluginInstanceId): Promise<void> {
    await this.eventBus.publish(new PluginRemovedFromTrackEvent(trackId, PluginReference.create(pluginId.toString())));
  }
} 