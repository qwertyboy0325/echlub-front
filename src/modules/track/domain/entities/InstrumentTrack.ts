import { BaseTrack } from './BaseTrack';
import { TrackId } from '../value-objects/TrackId';
import { TrackRouting } from '../value-objects/TrackRouting';
import { PluginInstanceId } from '../../../plugin/domain/value-objects/PluginInstanceId';
import { MidiClipId } from '../value-objects/MidiClipId';
import { ClipId } from '../value-objects/ClipId';

export class InstrumentTrack extends BaseTrack {
  private midiClipIds: MidiClipId[] = [];
  private instrumentPluginId?: PluginInstanceId;

  constructor(
    trackId: TrackId,
    name: string,
    routing: TrackRouting,
    type: string,
    plugins: PluginInstanceId[] = []
  ) {
    super(trackId, name, routing, type);
    plugins.forEach(plugin => this.addPlugin(plugin));
  }

  addClip(clipId: ClipId): void {
    if (clipId instanceof MidiClipId) {
      if (!this.midiClipIds.some(id => id.equals(clipId))) {
        this.midiClipIds.push(clipId);
        this.incrementVersion();
      }
    } else {
      throw new Error('Only MIDI clips can be added to instrument tracks');
    }
  }

  removeClip(clipId: ClipId): void {
    if (clipId instanceof MidiClipId) {
      this.midiClipIds = this.midiClipIds.filter(id => !id.equals(clipId));
      this.incrementVersion();
    } else {
      throw new Error('Only MIDI clips can be removed from instrument tracks');
    }
  }

  setInstrumentPlugin(pluginId: PluginInstanceId): void {
    this.instrumentPluginId = pluginId;
    this.incrementVersion();
  }

  getMidiClips(): MidiClipId[] {
    return [...this.midiClipIds];
  }

  getInstrumentPlugin(): PluginInstanceId | undefined {
    return this.instrumentPluginId;
  }

  getType(): string {
    return 'instrument';
  }
} 