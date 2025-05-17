import { TrackId } from '../value-objects/TrackId';
import { TrackRouting } from '../value-objects/TrackRouting';
import { ClipId } from '../value-objects/ClipId';
import { IAggregate } from '../interfaces/IAggregate';
import { TrackType } from '../value-objects/TrackType';
import { IPluginReference } from '../interfaces/IPluginReference';

export interface TrackState {
  name: string;
  routing: TrackRouting;
  mute: boolean;
  solo: boolean;
  volume: number;
  plugins: IPluginReference[];
}

export abstract class BaseTrack implements IAggregate {
  private _version: number = 0;
  private _plugins: IPluginReference[] = [];
  protected mute: boolean = false;
  protected solo: boolean = false;
  protected volume: number = 1;

  constructor(
    protected readonly trackId: TrackId,
    protected name: string,
    protected routing: TrackRouting,
    protected readonly trackType: TrackType
  ) {}

  getId(): string {
    return this.trackId.toString();
  }

  getVersion(): number {
    return this._version;
  }

  incrementVersion(): void {
    this._version++;
  }

  protected doIncrementVersion(): void {
    this.incrementVersion();
  }

  getTrackId(): TrackId {
    return this.trackId;
  }

  getName(): string {
    return this.name;
  }

  getPlugins(): IPluginReference[] {
    return [...this._plugins];
  }

  getRouting(): TrackRouting {
    return this.routing;
  }

  abstract addClip(clipId: ClipId): void;
  abstract removeClip(clipId: ClipId): void;
  
  addPlugin(pluginRef: IPluginReference): void {
    if (!this._plugins.some(ref => ref.equals(pluginRef))) {
      this._plugins.push(pluginRef);
      this.incrementVersion();
    }
  }

  removePlugin(pluginRef: IPluginReference): void {
    this._plugins = this._plugins.filter(ref => !ref.equals(pluginRef));
    this.incrementVersion();
  }

  updateRouting(routing: TrackRouting): void {
    this.routing = routing;
    this.incrementVersion();
  }

  rename(newName: string): void {
    this.name = newName;
    this.incrementVersion();
  }

  setMute(mute: boolean): void {
    this.mute = mute;
    this.incrementVersion();
  }

  setSolo(solo: boolean): void {
    this.solo = solo;
    this.incrementVersion();
  }

  isMuted(): boolean {
    return this.mute;
  }

  isSolo(): boolean {
    return this.solo;
  }

  setVolume(volume: number): void {
    if (volume < 0) {
      throw new Error('Volume cannot be negative');
    }
    this.volume = volume;
    this.incrementVersion();
  }

  getVolume(): number {
    return this.volume;
  }

  getType(): TrackType {
    return this.trackType;
  }

  getState(): TrackState {
    return {
      name: this.name,
      routing: this.routing,
      mute: this.mute,
      solo: this.solo,
      volume: this.volume,
      plugins: [...this._plugins]
    };
  }

  toJSON(): object {
    return {
      trackId: this.trackId.toString(),
      name: this.name,
      routing: this.routing,
      type: this.trackType.toString(),
      version: this.getVersion(),
      plugins: this._plugins.map(p => p.toString()),
      state: this.getState()
    };
  }
} 
