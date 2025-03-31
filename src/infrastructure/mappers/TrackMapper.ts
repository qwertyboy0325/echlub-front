import type { Track } from '../../domain/models/Track';
import type { TrackDTO } from '../../data/models/TrackDTO';
import { TrackImpl } from '../../domain/models/Track';
import { ClipMapper } from './ClipMapper';

export class TrackMapper {
  static toDTO(track: Track): TrackDTO {
    return {
      id: track.id,
      name: track.name,
      projectId: track.projectId,
      clips: track.clips.map(clip => ClipMapper.toDTO(clip)),
      volume: track.volume,
      pan: track.pan,
      reverb: track.reverb,
      createdAt: track.createdAt ? track.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: track.updatedAt ? track.updatedAt.toISOString() : new Date().toISOString(),
      version: track.version
    };
  }

  static toDomain(dto: TrackDTO): Track {
    const track = new TrackImpl(dto.name);
    track.id = dto.id;
    track.projectId = dto.projectId;
    track.clips = dto.clips.map(clip => ClipMapper.toDomain(clip));
    track.volume = dto.volume;
    track.pan = dto.pan;
    track.reverb = dto.reverb;
    track.createdAt = new Date(dto.createdAt);
    track.updatedAt = new Date(dto.updatedAt);
    track.version = dto.version;
    return track;
  }
} 