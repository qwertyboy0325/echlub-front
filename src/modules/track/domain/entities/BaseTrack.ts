import { TrackId } from '../value-objects/TrackId';
import { TrackRouting } from '../value-objects/TrackRouting';
import { ClipId } from '../value-objects/ClipId';
import { IAggregate } from '../interfaces/IAggregate';
import { TrackCreatedEvent } from '../events/TrackCreatedEvent';
import { TrackRenamedEvent } from '../events/TrackRenamedEvent';
import { TrackRoutingChangedEvent } from '../events/TrackRoutingChangedEvent';
import { PluginAddedToTrackEvent } from '../events/PluginAddedToTrackEvent';
import { PluginRemovedFromTrackEvent } from '../events/PluginRemovedFromTrackEvent';
import { IPluginReference } from '../interfaces/IPluginReference';
import { PluginReference } from '../value-objects/PluginReference';

export abstract class BaseTrack implements IAggregate {
  private _version: number = 0;
  private _plugins: IPluginReference[] = [];
  protected mute: boolean = false;
  protected solo: boolean = false;
  protected type: string;
  protected volume: number = 1;

  constructor(
    protected readonly trackId: TrackId,
    protected name: string,
    protected routing: TrackRouting,
    type: string
  ) {
    this.type = type;
  }

  getId(): string {
    return this.trackId.toString();
  }

  getVersion(): number {
    return this._version;
  }

  incrementVersion(): void {
    this._version++;
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
    this.volume = volume;
    this.incrementVersion();
  }

  getVolume(): number {
    return this.volume;
  }

  protected applyEvent(event: any): void {
    if (event instanceof TrackCreatedEvent) {
      this.name = event.payload.name;
    } else if (event instanceof TrackRenamedEvent) {
      this.name = event.payload.newName;
    } else if (event instanceof TrackRoutingChangedEvent) {
      this.routing = event.payload.routing;
    } else if (event instanceof PluginAddedToTrackEvent) {
      this.addPlugin(PluginReference.create(event.payload.pluginId));
    } else if (event instanceof PluginRemovedFromTrackEvent) {
      this.removePlugin(PluginReference.create(event.payload.pluginId));
    }
  }

  getType(): string {
    return this.type;
  }

  toJSON(): object {
    return {
      trackId: this.trackId.toString(),
      name: this.name,
      routing: this.routing,
      type: this.getType(),
      version: this.getVersion(),
      plugins: this._plugins.map(p => p.toString())
    };
  }
} 