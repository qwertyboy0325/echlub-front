import { TrackId } from '../value-objects/track/TrackId';
import { BaseTrack } from '../entities/BaseTrack';
import { TrackRouting } from '../value-objects/track/TrackRouting';
import { PluginInstanceId } from '../../../plugin/domain/value-objects/PluginInstanceId';

export interface ITrackEventPublisher {
  publishTrackCreated(trackId: TrackId, name: string, type: 'audio' | 'instrument' | 'bus'): Promise<void>;
  publishTrackUpdated(trackId: TrackId, track: BaseTrack): Promise<void>;
  publishTrackDeleted(trackId: TrackId): Promise<void>;
  publishTrackRenamed(trackId: TrackId, newName: string): Promise<void>;
  publishTrackRoutingChanged(trackId: TrackId, routing: TrackRouting): Promise<void>;
  publishPluginAdded(trackId: TrackId, pluginId: PluginInstanceId): Promise<void>;
  publishPluginRemoved(trackId: TrackId, pluginId: PluginInstanceId): Promise<void>;
} 