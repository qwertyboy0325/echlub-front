import type { Audio } from '../../domain/models/Audio';
import type { AudioDTO } from '../../data/models/AudioDTO';
import { AudioImpl } from '../../domain/models/Audio';

export class AudioMapper {
  static toDTO(audio: Audio): AudioDTO {
    return {
      id: audio.id,
      name: audio.name,
      url: audio.url,
      duration: audio.duration,
      sampleRate: audio.sampleRate,
      channels: audio.channels,
      format: audio.format,
      metadata: audio.metadata,
      createdAt: audio.createdAt,
      updatedAt: audio.updatedAt,
      version: audio.version
    };
  }

  static toDomain(dto: AudioDTO): Audio {
    return new AudioImpl(
      dto.name,
      dto.url,
      dto.duration,
      dto.sampleRate,
      dto.channels,
      dto.format
    );
  }
} 