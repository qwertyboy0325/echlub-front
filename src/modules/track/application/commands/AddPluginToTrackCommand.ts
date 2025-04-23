import { TrackId } from '../../domain/value-objects/track/TrackId';
import { IPluginReference } from '../../domain/interfaces/IPluginReference';

export class AddPluginToTrackCommand {
  constructor(
    public readonly trackId: TrackId,
    public readonly pluginRef: IPluginReference
  ) {}
} 