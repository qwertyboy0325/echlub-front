import { TrackId } from '../../domain/value-objects/TrackId';
import { PluginInstanceId } from '../../../plugin/domain/value-objects/PluginInstanceId';

export class RemovePluginFromTrackCommand {
  constructor(
    public readonly trackId: TrackId,
    public readonly pluginId: PluginInstanceId
  ) {}
} 