import { BaseTrack } from './BaseTrack';
import { TrackId } from '../value-objects/track/TrackId';
import { TrackRouting } from '../value-objects/track/TrackRouting';
import { PluginInstanceId } from '../../../plugin/domain/value-objects/PluginInstanceId';
import { ClipId } from '../value-objects/clips/ClipId';
import { PluginReference } from '../value-objects/plugin/PluginReference';
import { TrackType } from '../value-objects/track/TrackType';
import { TrackState } from './BaseTrack';

export interface SendSetting {
  readonly id: string;
  readonly targetTrackId: string;
  readonly level: number;
  readonly pan: number;
}

export interface ReturnSetting {
  readonly id: string;
  readonly sourceTrackId: string;
  readonly level: number;
  readonly pan: number;
}

export class BusTrack extends BaseTrack {
  private readonly _sendSettings: Map<string, SendSetting> = new Map();
  private readonly _returnSettings: Map<string, ReturnSetting> = new Map();
  private readonly _inputTracks: Map<string, TrackId> = new Map();
  private readonly MAX_SENDS = 8;
  private readonly MAX_RETURNS = 8;
  private readonly MAX_INPUT_TRACKS = 16;

  constructor(
    trackId: TrackId,
    name: string,
    routing: TrackRouting,
    plugins: PluginInstanceId[] = [],
    sendSettings: SendSetting[] = [],
    returnSettings: ReturnSetting[] = [],
    initialState?: Partial<TrackState>
  ) {
    super(trackId, name, routing, TrackType.BUS, initialState);
    
    // 初始化插件
    plugins.forEach(plugin => {
      const pluginRef = new PluginReference(plugin.toString());
      this.addPlugin(pluginRef);
    });

    // 初始化 send 設定
    sendSettings.forEach(setting => {
      this.validateSendSetting(setting);
      this._sendSettings.set(setting.id, setting);
    });

    // 初始化 return 設定
    returnSettings.forEach(setting => {
      this.validateReturnSetting(setting);
      this._returnSettings.set(setting.id, setting);
    });
  }

  private validateSendSetting(setting: SendSetting): void {
    if (!setting.id) throw new Error('Send setting ID cannot be empty');
    if (!setting.targetTrackId) throw new Error('Target track ID cannot be empty');
    if (typeof setting.level !== 'number' || setting.level < 0 || setting.level > 1) {
      throw new Error('Send level must be between 0 and 1');
    }
    if (typeof setting.pan !== 'number' || setting.pan < -1 || setting.pan > 1) {
      throw new Error('Send pan must be between -1 and 1');
    }
  }

  private validateReturnSetting(setting: ReturnSetting): void {
    if (!setting.id) throw new Error('Return setting ID cannot be empty');
    if (!setting.sourceTrackId) throw new Error('Source track ID cannot be empty');
    if (typeof setting.level !== 'number' || setting.level < 0 || setting.level > 1) {
      throw new Error('Return level must be between 0 and 1');
    }
    if (typeof setting.pan !== 'number' || setting.pan < -1 || setting.pan > 1) {
      throw new Error('Return pan must be between -1 and 1');
    }
  }

  addClip(clipId: ClipId): void {
    throw new Error('Bus tracks cannot have clips');
  }

  removeClip(clipId: ClipId): void {
    throw new Error('Bus tracks cannot have clips');
  }

  addSendSetting(setting: SendSetting): void {
    if (this._sendSettings.size >= this.MAX_SENDS) {
      throw new Error(`Cannot add more than ${this.MAX_SENDS} send settings`);
    }
    this.validateSendSetting(setting);
    if (!this._sendSettings.has(setting.id)) {
      this._sendSettings.set(setting.id, setting);
      this.incrementVersion();
    }
  }

  removeSendSetting(settingId: string): boolean {
    if (this._sendSettings.delete(settingId)) {
      this.incrementVersion();
      return true;
    }
    return false;
  }

  addReturnSetting(setting: ReturnSetting): void {
    if (this._returnSettings.size >= this.MAX_RETURNS) {
      throw new Error(`Cannot add more than ${this.MAX_RETURNS} return settings`);
    }
    this.validateReturnSetting(setting);
    if (!this._returnSettings.has(setting.id)) {
      this._returnSettings.set(setting.id, setting);
      this.incrementVersion();
    }
  }

  removeReturnSetting(settingId: string): boolean {
    if (this._returnSettings.delete(settingId)) {
      this.incrementVersion();
      return true;
    }
    return false;
  }

  getSendSettings(): SendSetting[] {
    return Array.from(this._sendSettings.values());
  }

  getReturnSettings(): ReturnSetting[] {
    return Array.from(this._returnSettings.values());
  }

  addInputTrack(trackId: TrackId): void {
    if (!(trackId instanceof TrackId)) {
      throw new Error('Invalid track ID type');
    }
    if (this._inputTracks.size >= this.MAX_INPUT_TRACKS) {
      throw new Error(`Cannot add more than ${this.MAX_INPUT_TRACKS} input tracks`);
    }
    const trackIdStr = trackId.toString();
    if (!this._inputTracks.has(trackIdStr)) {
      this._inputTracks.set(trackIdStr, trackId);
      this.incrementVersion();
    }
  }

  removeInputTrack(trackId: TrackId): boolean {
    if (!(trackId instanceof TrackId)) {
      throw new Error('Invalid track ID type');
    }
    const trackIdStr = trackId.toString();
    if (this._inputTracks.delete(trackIdStr)) {
      this.incrementVersion();
      return true;
    }
    return false;
  }

  getInputTracks(): TrackId[] {
    return Array.from(this._inputTracks.values());
  }

  getType(): TrackType {
    return TrackType.BUS;
  }

  toJSON(): object {
    return {
      ...super.toJSON(),
      sendSettings: Array.from(this._sendSettings.values()),
      returnSettings: Array.from(this._returnSettings.values()),
      inputTracks: Array.from(this._inputTracks.values()).map(id => id.toString())
    };
  }

  getClips(): ClipId[] {
    return [];
  }
} 