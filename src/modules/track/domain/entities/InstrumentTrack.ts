import { BaseTrack } from './BaseTrack';
import { TrackId } from '../value-objects/TrackId';
import { TrackRouting } from '../value-objects/TrackRouting';
import { ClipId } from '../value-objects/ClipId';
import { MidiClipId } from '../value-objects/MidiClipId';
import { PluginInstanceId } from '../../../plugin/domain/value-objects/PluginInstanceId';
import { PluginReference } from '../value-objects/PluginReference';
import { TrackType } from '../value-objects/TrackType';

export class InstrumentTrack extends BaseTrack {
  private midiClipIds: MidiClipId[] = [];

  constructor(
    trackId: TrackId,
    name: string,
    routing: TrackRouting,
    public readonly midiClips: string[] = [],
    plugins: PluginInstanceId[] = []
  ) {
    super(trackId, name, routing, TrackType.INSTRUMENT);
    plugins.forEach(plugin => this.addPlugin(PluginReference.create(plugin.toString())));
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

  getMidiClips(): MidiClipId[] {
    return [...this.midiClipIds];
  }

  toJSON(): object {
    return {
      ...super.toJSON(),
      midiClips: this.midiClipIds.map(id => id.toString())
    };
  }
} 