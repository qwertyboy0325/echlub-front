import { TrackId } from '../../domain/value-objects/TrackId';
import { IPluginReference } from '../../domain/interfaces/IPluginReference';

export class AddPluginToTrackCommand {
  constructor(
    public readonly trackId: TrackId,
    public readonly pluginRef: IPluginReference
  ) {}
} 
