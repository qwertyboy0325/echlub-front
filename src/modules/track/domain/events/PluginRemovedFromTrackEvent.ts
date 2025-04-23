import { TrackId } from '../value-objects/track/TrackId';
import { IPluginReference } from '../interfaces/IPluginReference';
import { IDomainEvent } from '../interfaces/IDomainEvent';

export class PluginRemovedFromTrackEvent implements IDomainEvent {
  readonly eventType = 'track:plugin:removed';
  readonly timestamp: Date;
  readonly aggregateId: string;
  readonly payload: {
    pluginId: string;
  };

  constructor(
    public readonly trackId: TrackId,
    public readonly pluginRef: IPluginReference
  ) {
    this.timestamp = new Date();
    this.aggregateId = trackId.toString();
    this.payload = {
      pluginId: pluginRef.toString()
    };
  }

  getEventName(): string {
    return 'plugin:removed';
  }
} 