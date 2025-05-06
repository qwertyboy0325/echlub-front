import { BaseTrack } from './BaseTrack';
import { TrackId } from '../value-objects/TrackId';
import { TrackRouting } from '../value-objects/TrackRouting';
import { PluginInstanceId } from '../../../plugin/domain/value-objects/PluginInstanceId';
import { ClipId } from '../value-objects/ClipId';
import { PluginReference } from '../value-objects/PluginReference';
import { TrackType } from '../value-objects/TrackType';

export interface SendSetting {
  id: string;
  targetTrackId: string;
  level: number;
  pan: number;
}

export interface ReturnSetting {
  id: string;
  sourceTrackId: string;
  level: number;
  pan: number;
}

export class BusTrack extends BaseTrack {
  private _sendSettings: SendSetting[] = [];
  private _returnSettings: ReturnSetting[] = [];
  private inputTracks: Set<TrackId> = new Set();

  constructor(
    trackId: TrackId,
    name: string,
    routing: TrackRouting,
    plugins: PluginInstanceId[] = [],
    sendSettings: SendSetting[] = [],
    returnSettings: ReturnSetting[] = []
  ) {
    super(trackId, name, routing, TrackType.BUS);
    plugins.forEach(plugin => this.addPlugin(PluginReference.create(plugin.toString())));
    this._sendSettings = [...sendSettings];
    this._returnSettings = [...returnSettings];
  }

  addClip(_clipId: ClipId): void {
    throw new Error('Bus tracks cannot have clips');
  }

  removeClip(_clipId: ClipId): void {
    throw new Error('Bus tracks cannot have clips');
  }

  addSendSetting(setting: SendSetting): void {
    if (!this._sendSettings.some(s => s.id === setting.id)) {
      this._sendSettings.push(setting);
      this.incrementVersion();
    }
  }

  removeSendSetting(settingId: string): void {
    this._sendSettings = this._sendSettings.filter(s => s.id !== settingId);
    this.incrementVersion();
  }

  addReturnSetting(setting: ReturnSetting): void {
    if (!this._returnSettings.some(r => r.id === setting.id)) {
      this._returnSettings.push(setting);
      this.incrementVersion();
    }
  }

  removeReturnSetting(settingId: string): void {
    this._returnSettings = this._returnSettings.filter(r => r.id !== settingId);
    this.incrementVersion();
  }

  getSendSettings(): SendSetting[] {
    return [...this._sendSettings];
  }

  getReturnSettings(): ReturnSetting[] {
    return [...this._returnSettings];
  }

  addInputTrack(trackId: TrackId): void {
    if (!this.inputTracks.has(trackId)) {
      this.inputTracks.add(trackId);
      this.incrementVersion();
    }
  }

  removeInputTrack(trackId: TrackId): void {
    if (this.inputTracks.delete(trackId)) {
      this.incrementVersion();
    }
  }

  getInputTracks(): TrackId[] {
    return Array.from(this.inputTracks);
  }

  getType(): TrackType {
    return TrackType.BUS;
  }

  toJSON(): object {
    return {
      ...super.toJSON(),
      inputTracks: Array.from(this.inputTracks).map(id => id.toString())
    };
  }
} 