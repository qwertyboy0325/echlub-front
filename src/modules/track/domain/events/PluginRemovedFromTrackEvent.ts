import { DomainEvent } from '../../../../shared/domain';
import { TrackId } from '../value-objects/TrackId';
import { PluginReference } from '../value-objects/PluginReference';

export class PluginRemovedFromTrackEvent extends DomainEvent {
  public get eventType(): string {
    return 'track:plugin:removed';
  }
  
  public readonly payload: {
    pluginId: string;
  };

  constructor(
    public readonly trackId: TrackId,
    public readonly pluginRef: PluginReference
  ) {
    super('plugin:removed', trackId.toString());
    this.payload = {
      pluginId: pluginRef.toString()
    };
  }
} 
