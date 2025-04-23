import { BaseTrack } from '../entities/BaseTrack';
import { TrackNameChangedEvent } from '../events/TrackNameChangedEvent';
import { TrackGainChangedEvent } from '../events/TrackGainChangedEvent';
import { TrackRoutingChangedEvent } from '../events/TrackRoutingChangedEvent';
import { TrackMuteChangedEvent } from '../events/TrackMuteChangedEvent';
import { TrackSoloChangedEvent } from '../events/TrackSoloChangedEvent';
import type { IEventBus } from '../../../../core/event-bus/IEventBus';
import { TrackRouting } from '../value-objects/track/TrackRouting';
import { TrackId } from '../value-objects/track/TrackId';
import { ClipId } from '../value-objects/clips/ClipId';
import { IPluginReference } from '../interfaces/IPluginReference';
import { TrackType } from '../value-objects/track/TrackType';

export class TrackEventDecorator {
  constructor(
    private track: BaseTrack,
    private eventBus: IEventBus
  ) {}

  async rename(name: string): Promise<void> {
    const oldName = this.track.getName();
    this.track.rename(name);
    
    await this.eventBus.publish(new TrackNameChangedEvent(
      TrackId.fromString(this.track.getId()),
      oldName,
      name
    ));
  }

  async setVolume(volume: number): Promise<void> {
    const oldVolume = this.track.getVolume();
    this.track.setVolume(volume);
    
    await this.eventBus.publish(new TrackGainChangedEvent(
      TrackId.fromString(this.track.getId()),
      oldVolume,
      volume
    ));
  }

  async setRouting(routing: TrackRouting): Promise<void> {
    const oldRouting = this.track.getRouting();
    this.track.setRouting(routing);
    
    await this.eventBus.publish(new TrackRoutingChangedEvent(
      TrackId.fromString(this.track.getId()),
      oldRouting,
      routing
    ));
  }

  async setMuted(muted: boolean): Promise<void> {
    const oldMuted = this.track.isMuted();
    this.track.setMuted(muted);
    
    await this.eventBus.publish(new TrackMuteChangedEvent(
      TrackId.fromString(this.track.getId()),
      oldMuted,
      muted
    ));
  }

  async setSolo(solo: boolean): Promise<void> {
    const oldSolo = this.track.isSolo();
    this.track.setSolo(solo);
    
    await this.eventBus.publish(new TrackSoloChangedEvent(
      TrackId.fromString(this.track.getId()),
      oldSolo,
      solo
    ));
  }

  // 代理其他方法到原始 track
  getId(): string {
    return this.track.getId();
  }

  getName(): string {
    return this.track.getName();
  }

  getVolume(): number {
    return this.track.getVolume();
  }

  getRouting(): TrackRouting {
    return this.track.getRouting();
  }

  isMuted(): boolean {
    return this.track.isMuted();
  }

  isSolo(): boolean {
    return this.track.isSolo();
  }

  getType(): TrackType {
    return this.track.getType();
  }

  getClips(): ClipId[] {
    return this.track.getClips();
  }

  getPlugins(): IPluginReference[] {
    return this.track.getPlugins();
  }

  getVersion(): number {
    return this.track.getVersion();
  }
} 