import { BaseTrack } from './BaseTrack';
import { TrackId } from '../value-objects/TrackId';
import { TrackRouting } from '../value-objects/TrackRouting';
import { PluginInstanceId } from '../../../plugin/domain/value-objects/PluginInstanceId';
import { ClipId } from '../value-objects/ClipId';

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

  constructor(
    trackId: TrackId,
    name: string,
    routing: TrackRouting,
    type: string,
    plugins: PluginInstanceId[] = [],
    sendSettings: SendSetting[] = [],
    returnSettings: ReturnSetting[] = []
  ) {
    super(trackId, name, routing, type);
    plugins.forEach(plugin => this.addPlugin(plugin));
    this._sendSettings = [...sendSettings];
    this._returnSettings = [...returnSettings];
  }

  addClip(clipId: ClipId): void {
    throw new Error('Bus tracks cannot contain clips');
  }

  removeClip(clipId: ClipId): void {
    throw new Error('Bus tracks cannot contain clips');
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

  getType(): string {
    return 'bus';
  }
} 