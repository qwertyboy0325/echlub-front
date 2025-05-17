import { DomainEvent } from '../../../../shared/domain';
import { TrackId } from '../value-objects/TrackId';
import { PluginInstanceId } from '../../../plugin/domain/value-objects/PluginInstanceId';

export class PluginAddedToTrackEvent extends DomainEvent {
  public get eventType(): string {
    return 'track:plugin:added';
  }
  
  public readonly payload: {
    pluginId: string;
  };

  constructor(
    public readonly trackId: TrackId,
    public readonly pluginId: PluginInstanceId
  ) {
    super('plugin:added', trackId.toString());
    this.payload = {
      pluginId: pluginId.toString()
    };
  }

  getEventName(): string {
    return 'plugin:added';
  }
} 
