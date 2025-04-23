import { TrackId } from '../value-objects/track/TrackId';
import { TrackRouting } from '../value-objects/track/TrackRouting';
import { IPluginReference } from '../interfaces/IPluginReference';
import { ClipId } from '../value-objects/clips/ClipId';
import { IAggregateRoot } from '../interfaces/IAggregateRoot';
import { TrackType } from '../value-objects/track/TrackType';

export interface TrackState {
  id: string;
  name: string;
  type: TrackType;
  routing: TrackRouting;
  plugins: IPluginReference[];
  isMuted: boolean;
  isSolo: boolean;
  volume: number;
  version: number;
}

/**
 * Track 是一個聚合根，它負責：
 * 1. 管理 Clips 的生命週期和一致性
 * 2. 維護 Plugin 鏈的順序和狀態
 * 3. 確保路由設置的有效性
 * 4. 控制音量、靜音等狀態的一致性
 */
export abstract class BaseTrack implements IAggregateRoot {
  protected _version: number = 1;
  protected _plugins: IPluginReference[] = [];
  protected _isMuted: boolean = false;
  protected _isSolo: boolean = false;
  protected _volume: number = 1.0;
  private readonly MAX_PLUGINS = 10;

  constructor(
    protected readonly _id: TrackId,
    protected _name: string,
    protected _routing: TrackRouting,
    protected readonly _type: TrackType,
    initialState?: Partial<TrackState>
  ) {
    this.validateConstructorParams();
    if (initialState) {
      this.initializeState(initialState);
    }
  }

  private validateConstructorParams(): void {
    if (!this._id) throw new Error('Track ID cannot be null');
    if (!this._name) throw new Error('Track name cannot be empty');
    if (!this._routing) throw new Error('Track routing cannot be null');
    if (!this._type) throw new Error('Track type cannot be null');
  }

  /**
   * 驗證版本號是否匹配預期
   * @throws {Error} 當版本號不匹配時
   */
  protected validateVersion(expectedVersion: number): void {
    if (this._version !== expectedVersion) {
      throw new Error(`Version mismatch. Expected ${expectedVersion}, got ${this._version}`);
    }
  }

  getId(): string {
    return this._id.toString();
  }

  equals(other: IAggregateRoot): boolean {
    if (!(other instanceof BaseTrack)) {
      return false;
    }
    return this._id.equals(other._id);
  }

  getVersion(): number {
    return this._version;
  }

  incrementVersion(): void {
    this._version++;
  }

  getName(): string {
    return this._name;
  }

  /**
   * 重命名軌道
   * @throws {Error} 當名稱為空時
   */
  rename(name: string): void {
    if (!name?.trim()) {
      throw new Error('Track name cannot be empty or whitespace');
    }
    this._name = name.trim();
    this.incrementVersion();
  }

  getType(): TrackType {
    return this._type;
  }

  getRouting(): TrackRouting {
    return this._routing;
  }

  setRouting(routing: TrackRouting): void {
    if (!routing) {
      throw new Error('Routing cannot be null');
    }
    this._routing = routing;
    this.incrementVersion();
  }

  abstract addClip(clipId: ClipId): void;
  abstract removeClip(clipId: ClipId): void;
  abstract getClips(): ClipId[];
  
  /**
   * 添加插件到軌道
   * @throws {Error} 當插件已存在或超出最大數量限制時
   */
  addPlugin(pluginRef: IPluginReference): void {
    if (!pluginRef) {
      throw new Error('Plugin reference cannot be null');
    }
    if (this._plugins.length >= this.MAX_PLUGINS) {
      throw new Error(`Cannot add more than ${this.MAX_PLUGINS} plugins to a track`);
    }
    if (this._plugins.some(ref => ref.equals(pluginRef))) {
      throw new Error('Plugin already exists in track');
    }
    this._plugins.push(pluginRef);
    this.incrementVersion();
  }

  /**
   * 從軌道移除插件
   * @returns {boolean} 是否成功移除插件
   */
  removePlugin(pluginRef: IPluginReference): boolean {
    if (!pluginRef) {
      throw new Error('Plugin reference cannot be null');
    }
    const index = this._plugins.findIndex(ref => ref.equals(pluginRef));
    if (index !== -1) {
      this._plugins.splice(index, 1);
      this.incrementVersion();
      return true;
    }
    return false;
  }

  getPlugins(): IPluginReference[] {
    return [...this._plugins];
  }

  setMuted(muted: boolean): void {
    if (typeof muted !== 'boolean') {
      throw new Error('Mute value must be a boolean');
    }
    this._isMuted = muted;
    this.incrementVersion();
  }

  isMuted(): boolean {
    return this._isMuted;
  }

  setSolo(solo: boolean): void {
    if (typeof solo !== 'boolean') {
      throw new Error('Solo value must be a boolean');
    }
    this._isSolo = solo;
    this.incrementVersion();
  }

  isSolo(): boolean {
    return this._isSolo;
  }

  /**
   * 設置音量
   * @throws {Error} 當音量值無效時
   */
  setVolume(volume: number): void {
    if (typeof volume !== 'number' || isNaN(volume)) {
      throw new Error('Volume must be a number');
    }
    if (volume < 0) {
      throw new Error('Volume cannot be negative');
    }
    if (volume > 2) {
      throw new Error('Volume cannot exceed 2.0 (200%)');
    }
    this._volume = volume;
    this.incrementVersion();
  }

  getVolume(): number {
    return this._volume;
  }

  /**
   * 初始化狀態
   * 用於創建和複製時設置初始狀態，不會觸發版本號增加
   */
  protected initializeState(state: Partial<TrackState>): void {
    if (state.volume !== undefined) {
      this._volume = state.volume;
    }
    if (state.isMuted !== undefined) {
      this._isMuted = state.isMuted;
    }
    if (state.isSolo !== undefined) {
      this._isSolo = state.isSolo;
    }
    if (state.version !== undefined) {
      this._version = state.version;
    }
    if (state.plugins) {
      this._plugins = [...state.plugins];
    }
  }

  toJSON(): object {
    return {
      id: this.getId(),
      name: this._name,
      type: this._type.toString(),
      routing: this._routing.toJSON(),
      plugins: this._plugins.map(p => p.toJSON()),
      isMuted: this._isMuted,
      isSolo: this._isSolo,
      volume: this._volume,
      version: this._version
    };
  }
} 