import { BaseTrack } from './BaseTrack';
import { TrackId } from '../value-objects/TrackId';
import { TrackRouting } from '../value-objects/TrackRouting';
import { AudioClipId } from '../value-objects/AudioClipId';
import { ClipId } from '../value-objects/ClipId';
import { TrackType } from '../value-objects/TrackType';

export class AudioTrack extends BaseTrack {
  private audioClipIds: AudioClipId[] = [];

  constructor(
    trackId: TrackId,
    name: string,
    routing: TrackRouting,
    public readonly audioClips: string[] = []
  ) {
    super(trackId, name, routing, TrackType.AUDIO);
  }

  addClip(clipId: ClipId): void {
    if (clipId instanceof AudioClipId) {
      if (!this.audioClipIds.some(id => id.equals(clipId))) {
        this.audioClipIds.push(clipId);
        this.incrementVersion();
      }
    } else {
      throw new Error('Only audio clips can be added to audio tracks');
    }
  }

  removeClip(clipId: ClipId): void {
    if (clipId instanceof AudioClipId) {
      this.audioClipIds = this.audioClipIds.filter(id => !id.equals(clipId));
      this.incrementVersion();
    } else {
      throw new Error('Only audio clips can be removed from audio tracks');
    }
  }

  getAudioClips(): AudioClipId[] {
    return [...this.audioClipIds];
  }

  toJSON(): object {
    return {
      ...super.toJSON(),
      audioClips: this.audioClipIds.map(id => id.toString())
    };
  }
} 
