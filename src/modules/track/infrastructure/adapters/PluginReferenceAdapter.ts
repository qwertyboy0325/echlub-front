import { injectable } from 'inversify';
import { PluginInstanceId } from '../../../plugin/domain/value-objects/PluginInstanceId';
import { IPluginReference } from '../../domain/interfaces/IPluginReference';
import { PluginReference } from '../../domain/value-objects/PluginReference';

@injectable()
export class PluginReferenceAdapter {
  toPluginReference(pluginId: string): IPluginReference {
    return PluginReference.create(pluginId);
  }

  toPluginInstanceId(reference: IPluginReference): PluginInstanceId {
    return PluginInstanceId.fromString(reference.id);
  }
} 
