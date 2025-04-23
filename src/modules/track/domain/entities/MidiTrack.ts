import { BaseTrack } from './BaseTrack';
import { TrackId } from '../value-objects/track/TrackId';
import { TrackRouting } from '../value-objects/track/TrackRouting';
import { ClipId } from '../value-objects/clips/ClipId';
import { TrackType } from '../value-objects/track/TrackType';
import { TrackState } from './BaseTrack';
import { IPluginReference } from '../interfaces/IPluginReference';

export class MidiTrack extends BaseTrack {
  private midiClipIds: ClipId[] = [];

  constructor(
    trackId: TrackId,
    name: string,
    routing: TrackRouting,
    public readonly midiClips: string[] = [],
    plugins: IPluginReference[] = [],
    initialState?: Partial<TrackState>
  ) {
    super(trackId, name, routing, TrackType.MIDI, initialState);
    plugins.forEach(plugin => this.addPlugin(plugin));
  }

  addClip(clipId: ClipId): void {
    if (clipId instanceof ClipId) {
      if (!this.midiClipIds.some(id => id.equals(clipId))) {
        this.midiClipIds.push(clipId);
        this.incrementVersion();
      }
    } else {
      throw new Error('Only MIDI clips can be added to MIDI tracks');
    }
  }

  removeClip(clipId: ClipId): void {
    if (clipId instanceof ClipId) {
      const originalLength = this.midiClipIds.length;
      this.midiClipIds = this.midiClipIds.filter(id => !id.equals(clipId));
      if (this.midiClipIds.length < originalLength) {
        this.incrementVersion();
      }
    } else {
      throw new Error('Only MIDI clips can be removed from MIDI tracks');
    }
  }

  getMidiClips(): ClipId[] {
    return [...this.midiClipIds];
  }

  getClips(): ClipId[] {
    return [...this.midiClipIds];
  }

  toJSON(): object {
    return {
      ...super.toJSON(),
      midiClips: this.midiClipIds.map(id => id.toString())
    };
  }
} 