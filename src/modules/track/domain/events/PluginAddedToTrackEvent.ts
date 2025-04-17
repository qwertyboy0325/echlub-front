import { TrackId } from '../value-objects/TrackId';
import { PluginInstanceId } from '../../../plugin/domain/value-objects/PluginInstanceId';
import { IDomainEvent } from '../interfaces/IDomainEvent';

export class PluginAddedToTrackEvent implements IDomainEvent {
  readonly eventType = 'track:plugin:added';
  readonly timestamp: Date;
  readonly aggregateId: string;
  readonly payload: {
    pluginId: string;
  };

  constructor(
    trackId: TrackId,
    pluginId: PluginInstanceId
  ) {
    this.timestamp = new Date();
    this.aggregateId = trackId.toString();
    this.payload = {
      pluginId: pluginId.toString()
    };
  }

  getEventName(): string {
    return 'plugin:added';
  }
} 