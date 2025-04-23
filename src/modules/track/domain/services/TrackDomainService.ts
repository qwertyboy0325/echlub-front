import { injectable } from 'inversify';
import { BaseTrack } from '../entities/BaseTrack';
import { TrackId } from '../value-objects/track/TrackId';
import { PluginInstanceId } from '../../../plugin/domain/value-objects/PluginInstanceId';
import { ClipId } from '../value-objects/clips/ClipId';
import { PluginReference } from '../value-objects/plugin/PluginReference';

@injectable()
export class TrackDomainService {
  validateTrackName(name: string): boolean {
    return name.length > 0;
  }

  canAddClip(track: BaseTrack, clipId: ClipId): boolean {
    try {
      track.addClip(clipId);
      return true;
    } catch {
      return false;
    }
  }

  canRemoveClip(track: BaseTrack, clipId: ClipId): boolean {
    try {
      track.removeClip(clipId);
      return true;
    } catch {
      return false;
    }
  }

  canAddPlugin(track: BaseTrack, pluginId: PluginInstanceId): boolean {
    const pluginRef = new PluginReference(pluginId.toString());
    return !track.getPlugins().some(id => id.equals(pluginRef));
  }

  canRemovePlugin(track: BaseTrack, pluginId: PluginInstanceId): boolean {
    const pluginRef = new PluginReference(pluginId.toString());
    return track.getPlugins().some(id => id.equals(pluginRef));
  }
} 