import { TrackId } from '../value-objects/TrackId';
import { PluginInstanceId } from '../../../plugin/domain/value-objects/PluginInstanceId';
import { IDomainEvent } from '../interfaces/IDomainEvent';

export class PluginRemovedFromTrackEvent implements IDomainEvent {
  constructor(
    public readonly trackId: TrackId,
    public readonly pluginId: PluginInstanceId,
    public readonly timestamp: Date = new Date()
  ) {}

  getEventName(): string {
    return 'plugin:removed';
  }
} 