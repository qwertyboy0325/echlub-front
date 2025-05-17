import { injectable } from 'inversify';
import { BaseTrack } from '../entities/BaseTrack';
import { PluginInstanceId } from '../../../plugin/domain/value-objects/PluginInstanceId';
import { ClipId } from '../value-objects/ClipId';

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
    return !track.getPlugins().some(id => id.equals(pluginId));
  }

  canRemovePlugin(track: BaseTrack, pluginId: PluginInstanceId): boolean {
    return track.getPlugins().some(id => id.equals(pluginId));
  }
} 
