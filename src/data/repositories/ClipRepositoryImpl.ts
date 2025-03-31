import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import type { Clip } from '../../domain/models/Clip';
import type { ClipRepository } from '../../domain/repositories/ClipRepository';
import type { ClipDTO } from '../models/ClipDTO';
import { BaseRepositoryImpl } from './BaseRepositoryImpl';
import { ClipMapper } from '../../infrastructure/mappers/ClipMapper';
import { ClipImpl } from '../../domain/models/Clip';
import type { Storage } from '../../infrastructure/storage/Storage';
import { BaseDTO } from '../models/BaseDTO';
import { TYPES } from '../../core/di/types';

@injectable()
export class ClipRepositoryImpl extends BaseRepositoryImpl<ClipImpl, ClipDTO> implements ClipRepository {
  constructor(
    @inject(TYPES.Storage) storage: Storage
  ) {
    super(storage, 'clip_storage');
  }

  async findByTrackId(trackId: string): Promise<ClipImpl[]> {
    const data = (await this.storage.get<Record<string, ClipDTO>>(this.storageKey)) || {};
    return Object.values(data)
      .filter(d => d.trackId === trackId)
      .map(d => this.toDomain(d));
  }

  async findByAudioUrl(audioUrl: string): Promise<ClipImpl[]> {
    const data = (await this.storage.get<Record<string, ClipDTO>>(this.storageKey)) || {};
    return Object.values(data)
      .filter(d => d.audioUrl === audioUrl)
      .map(d => this.toDomain(d));
  }

  async findByTimeRange(startTime: number, endTime: number): Promise<ClipImpl[]> {
    // TODO: Implement time range filtering
    return [];
  }

  protected toDTO(entity: ClipImpl): ClipDTO {
    return {
      id: entity.id,
      name: entity.name,
      audioUrl: entity.audioUrl,
      trackId: entity.trackId,
      startTime: entity.startTime,
      duration: entity.duration,
      position: entity.position,
      volume: entity.volume,
      pan: entity.pan,
      muted: entity.muted,
      soloed: entity.soloed,
      effects: entity.effects,
      automation: entity.automation,
      version: entity.version,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString()
    };
  }

  protected toDomain(dto: ClipDTO): ClipImpl {
    const entity = new ClipImpl(
      dto.audioUrl,
      dto.startTime,
      dto.duration,
      dto.position,
      dto.name,
      dto.id
    );
    entity.version = dto.version;
    entity.createdAt = new Date(dto.createdAt);
    entity.updatedAt = new Date(dto.updatedAt);
    entity.trackId = dto.trackId;
    entity.volume = dto.volume;
    entity.pan = dto.pan;
    entity.muted = dto.muted;
    entity.soloed = dto.soloed;
    entity.effects = dto.effects;
    entity.automation = dto.automation;
    return entity;
  }
} 