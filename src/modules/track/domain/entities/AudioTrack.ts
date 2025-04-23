import { BaseTrack, TrackState } from './BaseTrack';
import { TrackId } from '../value-objects/track/TrackId';
import { TrackRouting } from '../value-objects/track/TrackRouting';
import { ClipId } from '../value-objects/clips/ClipId';
import { TrackType } from '../value-objects/track/TrackType';

export class AudioTrack extends BaseTrack {
  private audioClipIds: ClipId[] = [];

  constructor(
    id: TrackId,
    name: string,
    routing: TrackRouting,
    initialState?: Partial<TrackState>
  ) {
    super(id, name, routing, TrackType.AUDIO, initialState);
  }

  addClip(clipId: ClipId): void {
    if (clipId instanceof ClipId) {
      if (!this.audioClipIds.some(id => id.equals(clipId))) {
        this.audioClipIds.push(clipId);
        this.incrementVersion();
      }
    } else {
      throw new Error('Only audio clips can be added to audio tracks');
    }
  }

  removeClip(clipId: ClipId): void {
    if (clipId instanceof ClipId) {
      this.audioClipIds = this.audioClipIds.filter(id => !id.equals(clipId));
      this.incrementVersion();
    } else {
      throw new Error('Only audio clips can be removed from audio tracks');
    }
  }

  getAudioClips(): ClipId[] {
    return [...this.audioClipIds];
  }

  getClips(): ClipId[] {
    return [...this.audioClipIds];
  }

  toJSON(): object {
    return {
      ...super.toJSON(),
      audioClips: this.audioClipIds.map(id => id.toString())
    };
  }

  clone(): AudioTrack {
    const state: Partial<TrackState> = {
      volume: this._volume,
      isMuted: this._isMuted,
      isSolo: this._isSolo,
      plugins: [...this._plugins],
      version: 1
    };
    return new AudioTrack(
      TrackId.create(),
      this._name,
      this._routing.clone(),
      state
    );
  }
} 