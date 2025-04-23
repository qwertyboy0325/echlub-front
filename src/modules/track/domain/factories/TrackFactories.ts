import { injectable, inject } from 'inversify';
import { TrackId } from '../value-objects/track/TrackId';
import { TrackRouting } from '../value-objects/track/TrackRouting';
import { AudioTrack } from '../entities/AudioTrack';
import { MidiTrack } from '../entities/MidiTrack';
import { BusTrack } from '../entities/BusTrack';
import { IPluginReference } from '../interfaces/IPluginReference';
import { BaseTrack } from '../entities/BaseTrack';
import { TrackType } from '../value-objects/track/TrackType';
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
    routing: TrackRouting = new TrackRouting('', ''),
    plugins: IPluginReference[] = []
  ): AudioTrack {
    const track = new AudioTrack(id, name, routing);
    plugins.forEach(plugin => track.addPlugin(plugin));
    return track;
  }

  clone(sourceTrack: BaseTrack, newId: TrackId, newName?: string): AudioTrack {
    if (!(sourceTrack instanceof AudioTrack)) {
      throw new Error('Source track must be an AudioTrack');
    }

    const name = newName || `Copy of ${sourceTrack.getName()}`;
    const state = {
      volume: sourceTrack.getVolume(),
      isMuted: sourceTrack.isMuted(),
      isSolo: sourceTrack.isSolo(),
      plugins: sourceTrack.getPlugins(),
      version: sourceTrack.getVersion()
    };

    return new AudioTrack(
      newId,
      name,
      sourceTrack.getRouting().clone(),
      state
    );
  }
}

/**
 * MIDI音軌工廠
 */
@injectable()
export class MidiTrackFactory implements ITrackFactory {
  create(
    id: TrackId,
    name: string,
    routing: TrackRouting = new TrackRouting('', ''),
    plugins: IPluginReference[] = []
  ): MidiTrack {
    const track = new MidiTrack(id, name, routing);
    plugins.forEach(plugin => track.addPlugin(plugin));
    return track;
  }

  clone(sourceTrack: BaseTrack, newId: TrackId, newName?: string): MidiTrack {
    if (!(sourceTrack instanceof MidiTrack)) {
      throw new Error('Source track must be a MidiTrack');
    }

    const name = newName || `Copy of ${sourceTrack.getName()}`;
    const state = {
      volume: sourceTrack.getVolume(),
      isMuted: sourceTrack.isMuted(),
      isSolo: sourceTrack.isSolo(),
      plugins: sourceTrack.getPlugins(),
      version: sourceTrack.getVersion()
    };

    const midiClips = sourceTrack.getMidiClips().map(clip => clip.toString());

    return new MidiTrack(
      newId,
      name,
      sourceTrack.getRouting().clone(),
      midiClips,
      sourceTrack.getPlugins(),
      state
    );
  }
}

/**
 * 匯流排音軌工廠
 */
@injectable()
export class BusTrackFactory implements ITrackFactory {
  create(
    id: TrackId,
    name: string,
    routing: TrackRouting = new TrackRouting('', ''),
    plugins: IPluginReference[] = []
  ): BusTrack {
    const track = new BusTrack(id, name, routing);
    plugins.forEach(plugin => track.addPlugin(plugin));
    return track;
  }

  clone(sourceTrack: BaseTrack, newId: TrackId, newName?: string): BusTrack {
    if (!(sourceTrack instanceof BusTrack)) {
      throw new Error('Source track must be a BusTrack');
    }

    const name = newName || `Copy of ${sourceTrack.getName()}`;
    const state = {
      volume: sourceTrack.getVolume(),
      isMuted: sourceTrack.isMuted(),
      isSolo: sourceTrack.isSolo(),
      plugins: sourceTrack.getPlugins(),
      version: sourceTrack.getVersion()
    };

    const track = new BusTrack(
      newId,
      name,
      sourceTrack.getRouting().clone(),
      [],  // 空的插件列表，我們會在後面手動添加
      [],  // 空的 send 設定列表
      [],  // 空的 return 設定列表
      state
    );

    // 手動添加插件
    sourceTrack.getPlugins().forEach(plugin => track.addPlugin(plugin));

    // 複製 send 和 return 設定
    sourceTrack.getSendSettings().forEach(setting => track.addSendSetting(setting));
    sourceTrack.getReturnSettings().forEach(setting => track.addReturnSetting(setting));

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
    @inject(TrackTypes.MidiTrackFactory) midiFactory: MidiTrackFactory,
    @inject(TrackTypes.BusTrackFactory) busFactory: BusTrackFactory
  ) {
    this.factories.set(TrackType.AUDIO, audioFactory);
    this.factories.set(TrackType.MIDI, midiFactory);
    this.factories.set(TrackType.BUS, busFactory);
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