import type { Clip } from '../../domain/models/Clip';
import type { ClipDTO } from '../../data/models/ClipDTO';
import { ClipImpl } from '../../domain/models/Clip';
import { AudioMapper } from './AudioMapper';

export class ClipMapper {
  static toDTO(clip: Clip): ClipDTO {
    return {
      id: clip.id,
      name: clip.name,
      trackId: clip.trackId,
      audioUrl: clip.audioUrl,
      startTime: clip.startTime,
      duration: clip.duration,
      position: clip.position,
      volume: clip.volume,
      pan: clip.pan,
      muted: clip.muted,
      soloed: clip.soloed,
      effects: clip.effects,
      automation: clip.automation,
      createdAt: clip.createdAt.toISOString(),
      updatedAt: clip.updatedAt.toISOString(),
      version: clip.version
    };
  }

  static toDomain(dto: ClipDTO): Clip {
    const clip = new ClipImpl(
      dto.audioUrl,
      dto.startTime,
      dto.duration,
      0, // Default position
      dto.name
    );

    // Set additional properties
    clip.trackId = dto.trackId;
    clip.updateVolume(dto.volume);
    clip.updatePan(dto.pan);
    if (dto.muted) clip.toggleMute();
    if (dto.soloed) clip.toggleSolo();
    dto.effects.forEach(effectId => clip.addEffect(effectId));
    Object.entries(dto.automation).forEach(([parameter, data]) => {
      clip.updateAutomation(parameter, data);
    });

    return clip;
  }
} 