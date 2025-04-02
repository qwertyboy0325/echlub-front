import { Track } from '../../domain/Track';

export interface TrackViewModel {
  id: string;
  name: string;
  volume: number;
  pan: number;
  muted: boolean;
  soloed: boolean;
  color: string;
  clips: string[]; // clip IDs
}

export class TrackViewModelFactory {
  static fromDomain(track: Track): TrackViewModel {
    return {
      id: track.id,
      name: track.name,
      volume: track.volume,
      pan: track.pan,
      muted: track.muted,
      soloed: track.soloed,
      color: track.color,
      clips: track.clips.map(clip => clip.id)
    };
  }
} 