import { injectable, inject } from 'inversify';
import type { Audio } from '../../domain/models/Audio';
import type { AudioRepository } from '../../domain/repositories/AudioRepository';
import type { Storage } from '../../infrastructure/storage/Storage';
import { BaseRepositoryImpl } from './BaseRepositoryImpl';
import { AudioMapper } from '../../infrastructure/mappers/AudioMapper';
import { AudioImpl } from '../models/Audio';
import { BaseDTO } from '../models/BaseDTO';

export interface AudioDTO extends BaseDTO {
  name: string;
  url: string;
  duration: number;
  sampleRate: number;
  channels: number;
  format: string;
  metadata: Record<string, any>;
}

@injectable()
export class AudioRepositoryImpl extends BaseRepositoryImpl<AudioImpl, AudioDTO> implements AudioRepository {
  constructor(
    @inject('Storage') storage: Storage
  ) {
    super(storage, 'audio_storage');
  }

  async findByUrl(url: string): Promise<AudioImpl | null> {
    const data = (await this.storage.get<Record<string, AudioDTO>>(this.storageKey)) || {};
    const dto = Object.values(data).find(d => d.url === url);
    return dto ? this.toDomain(dto) : null;
  }

  async findByFormat(format: string): Promise<AudioImpl[]> {
    const data = (await this.storage.get<Record<string, AudioDTO>>(this.storageKey)) || {};
    return Object.values(data)
      .filter(d => d.format === format)
      .map(d => this.toDomain(d));
  }

  protected toDTO(entity: AudioImpl): AudioDTO {
    return {
      id: entity.id,
      name: entity.name,
      url: entity.url,
      duration: entity.duration,
      sampleRate: entity.sampleRate,
      channels: entity.channels,
      format: entity.format,
      metadata: entity.metadata,
      version: entity.version,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString()
    };
  }

  protected toDomain(dto: AudioDTO): AudioImpl {
    const entity = new AudioImpl(
      dto.name,
      dto.url,
      dto.duration,
      dto.sampleRate,
      dto.channels,
      dto.format,
      dto.metadata
    );
    entity.id = dto.id;
    entity.version = dto.version;
    entity.createdAt = new Date(dto.createdAt);
    entity.updatedAt = new Date(dto.updatedAt);
    return entity;
  }
} 