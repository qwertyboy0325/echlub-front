import { injectable, inject } from 'inversify';
import { TrackId } from '../value-objects/TrackId';
import { TrackRouting } from '../value-objects/TrackRouting';
import { AudioTrack } from '../entities/AudioTrack';
import { InstrumentTrack } from '../entities/InstrumentTrack';
import { BusTrack } from '../entities/BusTrack';
import { IPluginReference } from '../interfaces/IPluginReference';
import { BaseTrack } from '../entities/BaseTrack';
import { TrackType } from '../value-objects/TrackType';
import { ITrackFactory } from './ITrackFactory';
import { TrackTypes } from '../../di/TrackTypes';

/**
 * 音頻音軌工廠
 */
@injectable()
export class AudioTrackFactory implements ITrackFactory {
  create(
    id: TrackId,
    name: string,
    routing: TrackRouting = new TrackRouting(null, null),
    plugins: IPluginReference[] = []
  ): AudioTrack {
    const track = new AudioTrack(id, name, routing, 'audio');
    plugins.forEach(plugin => track.addPlugin(plugin));
    return track;
  }

  clone(sourceTrack: BaseTrack, newId: TrackId, newName?: string): AudioTrack {
    if (!(sourceTrack instanceof AudioTrack)) {
      throw new Error('Source track must be an AudioTrack');
    }

    const name = newName || `Copy of ${sourceTrack.getName()}`;
    const track = this.create(
      newId,
      name,
      sourceTrack.getRouting(),
      sourceTrack.getPlugins()
    );

    track.setVolume(sourceTrack.getVolume());
    track.setMute(sourceTrack.isMuted());
    track.setSolo(sourceTrack.isSolo());

    return track;
  }
}

/**
 * 樂器音軌工廠
 */
@injectable()
export class InstrumentTrackFactory implements ITrackFactory {
  create(
    id: TrackId,
    name: string,
    routing: TrackRouting = new TrackRouting(null, null),
    plugins: IPluginReference[] = []
  ): InstrumentTrack {
    const track = new InstrumentTrack(id, name, routing, 'instrument');
    plugins.forEach(plugin => track.addPlugin(plugin));
    return track;
  }

  clone(sourceTrack: BaseTrack, newId: TrackId, newName?: string): InstrumentTrack {
    if (!(sourceTrack instanceof InstrumentTrack)) {
      throw new Error('Source track must be an InstrumentTrack');
    }

    const name = newName || `Copy of ${sourceTrack.getName()}`;
    const track = this.create(
      newId,
      name,
      sourceTrack.getRouting(),
      sourceTrack.getPlugins()
    );

    track.setVolume(sourceTrack.getVolume());
    track.setMute(sourceTrack.isMuted());
    track.setSolo(sourceTrack.isSolo());

    return track;
  }
}

/**
 * 總線音軌工廠
 */
@injectable()
export class BusTrackFactory implements ITrackFactory {
  create(
    id: TrackId,
    name: string,
    routing: TrackRouting = new TrackRouting(null, null),
    plugins: IPluginReference[] = []
  ): BusTrack {
    const track = new BusTrack(id, name, routing, 'bus');
    plugins.forEach(plugin => track.addPlugin(plugin));
    return track;
  }

  clone(sourceTrack: BaseTrack, newId: TrackId, newName?: string): BusTrack {
    if (!(sourceTrack instanceof BusTrack)) {
      throw new Error('Source track must be a BusTrack');
    }

    const name = newName || `Copy of ${sourceTrack.getName()}`;
    const track = this.create(
      newId,
      name,
      sourceTrack.getRouting(),
      sourceTrack.getPlugins()
    );

    track.setVolume(sourceTrack.getVolume());
    track.setMute(sourceTrack.isMuted());
    track.setSolo(sourceTrack.isSolo());

    return track;
  }
}

/**
 * 音軌工廠註冊表
 */
@injectable()
export class TrackFactoryRegistry {
  private factories: Map<TrackType, ITrackFactory> = new Map();

  constructor(
    @inject(TrackTypes.AudioTrackFactory) audioFactory: AudioTrackFactory,
    @inject(TrackTypes.InstrumentTrackFactory) instrumentFactory: InstrumentTrackFactory,
    @inject(TrackTypes.BusTrackFactory) busFactory: BusTrackFactory
  ) {
    this.factories.set('audio', audioFactory);
    this.factories.set('instrument', instrumentFactory);
    this.factories.set('bus', busFactory);
  }

  getFactory(type: TrackType): ITrackFactory {
    const factory = this.factories.get(type);
    if (!factory) {
      throw new Error(`No factory registered for track type: ${type}`);
    }
    return factory;
  }

  createTrack(
    type: TrackType,
    id: TrackId,
    name: string,
    routing?: TrackRouting,
    plugins?: IPluginReference[]
  ): BaseTrack {
    return this.getFactory(type).create(id, name, routing, plugins);
  }

  cloneTrack(
    sourceTrack: BaseTrack,
    newId: TrackId,
    newName?: string
  ): BaseTrack {
    const type = sourceTrack.getType() as TrackType;
    return this.getFactory(type).clone(sourceTrack, newId, newName);
  }
} 