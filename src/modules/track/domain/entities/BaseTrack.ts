import { TrackId } from '../value-objects/TrackId';
import { TrackRouting } from '../value-objects/TrackRouting';
import { PluginInstanceId } from '../../../plugin/domain/value-objects/PluginInstanceId';
import { ClipId } from '../value-objects/ClipId';
import { IAggregate } from '../interfaces/IAggregate';
import { TrackCreatedEvent } from '../events/TrackCreatedEvent';
import { TrackRenamedEvent } from '../events/TrackRenamedEvent';
import { TrackRoutingChangedEvent } from '../events/TrackRoutingChangedEvent';
import { PluginAddedToTrackEvent } from '../events/PluginAddedToTrackEvent';
import { PluginRemovedFromTrackEvent } from '../events/PluginRemovedFromTrackEvent';

export abstract class BaseTrack implements IAggregate {
  private _version: number = 0;
  private _plugins: PluginInstanceId[] = [];
  protected mute: boolean = false;
  protected solo: boolean = false;
  protected type: string;
  protected volume: number = 1;
  public pluginInstanceIds: PluginInstanceId[] = [];

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

  getPlugins(): PluginInstanceId[] {
    return [...this._plugins];
  }

  getRouting(): TrackRouting {
    return this.routing;
  }

  abstract addClip(clipId: ClipId): void;
  abstract removeClip(clipId: ClipId): void;
  
  addPlugin(pluginId: PluginInstanceId): void {
    if (!this._plugins.some(id => id.equals(pluginId))) {
      this._plugins.push(pluginId);
      this.incrementVersion();
    }
  }

  removePlugin(pluginId: PluginInstanceId): void {
    this._plugins = this._plugins.filter(id => !id.equals(pluginId));
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
      this.name = event.name;
    } else if (event instanceof TrackRenamedEvent) {
      this.name = event.newName;
    } else if (event instanceof TrackRoutingChangedEvent) {
      this.routing = event.routing;
    } else if (event instanceof PluginAddedToTrackEvent) {
      this.addPlugin(event.pluginId);
    } else if (event instanceof PluginRemovedFromTrackEvent) {
      this.removePlugin(event.pluginId);
    }
  }

  getType(): string {
    return this.type;
  }

  getPluginInstanceIds(): PluginInstanceId[] {
    return [...this.pluginInstanceIds];
  }
} 