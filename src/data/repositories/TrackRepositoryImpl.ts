import { injectable, inject } from 'inversify';
import type { Track } from '../../domain/models/Track';
import { TrackImpl } from '../../domain/models/Track';
import type { TrackRepository } from '../../domain/repositories/TrackRepository';
import type { TrackDTO } from '../models/TrackDTO';
import type { Storage } from '../../infrastructure/storage/Storage';
import { BaseRepositoryImpl } from './BaseRepositoryImpl';
import { TrackMapper } from '../../infrastructure/mappers/TrackMapper';
import { ClipImpl } from '../../domain/models/Clip';

@injectable()
export class TrackRepositoryImpl extends BaseRepositoryImpl<TrackImpl, TrackDTO> implements TrackRepository {
  constructor(
    @inject('Storage') storage: Storage
  ) {
    super(storage, 'track_storage');
  }

  protected toDTO(entity: TrackImpl): TrackDTO {
    return {
      id: entity.id,
      name: entity.name,
      projectId: entity.projectId,
      clips: entity.clips.map(clip => ({
        id: clip.id,
        name: clip.name,
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
        trackId: clip.trackId,
        createdAt: clip.createdAt.toISOString(),
        updatedAt: clip.updatedAt.toISOString(),
        version: clip.version
      })),
      volume: entity.volume,
      pan: entity.pan,
      reverb: entity.reverb,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
      version: entity.version
    };
  }

  protected toDomain(dto: TrackDTO): TrackImpl {
    const track = new TrackImpl(dto.name);
    track.id = dto.id;
    track.projectId = dto.projectId;
    track.clips = dto.clips.map(clipDTO => {
      const clip = new ClipImpl(
        clipDTO.audioUrl,
        clipDTO.startTime,
        clipDTO.duration,
        clipDTO.position,
        clipDTO.name
      );
      clip.id = clipDTO.id;
      clip.volume = clipDTO.volume;
      clip.pan = clipDTO.pan;
      clip.muted = clipDTO.muted;
      clip.soloed = clipDTO.soloed;
      clip.effects = clipDTO.effects;
      clip.automation = clipDTO.automation;
      clip.trackId = clipDTO.trackId;
      clip.createdAt = new Date(clipDTO.createdAt);
      clip.updatedAt = new Date(clipDTO.updatedAt);
      clip.version = clipDTO.version;
      return clip;
    });
    track.volume = dto.volume;
    track.pan = dto.pan;
    track.reverb = dto.reverb;
    track.createdAt = new Date(dto.createdAt);
    track.updatedAt = new Date(dto.updatedAt);
    track.version = dto.version;
    return track;
  }

  async findByProjectId(projectId: string): Promise<TrackImpl[]> {
    const data = await this.storage.get<Record<string, TrackDTO>>(this.storageKey);
    if (!data) {
      return [];
    }
    return Object.values(data)
      .filter(item => item.projectId === projectId)
      .map(dto => this.toDomain(dto));
  }

  async findByClipId(clipId: string): Promise<TrackImpl[]> {
    const data = await this.storage.get<Record<string, TrackDTO>>(this.storageKey);
    if (!data) return [];

    return Object.values(data)
      .map(dto => this.toDomain(dto))
      .filter(track => track.clips.some(clip => clip.id === clipId));
  }

  async create(data: Partial<TrackDTO> = {}): Promise<TrackImpl> {
    const track = new TrackImpl(data.name || 'Untitled Track');
    if (data.projectId) track.projectId = data.projectId;
    if (data.clips) track.clips = data.clips.map(clipDTO => {
      const clip = new ClipImpl(
        clipDTO.audioUrl,
        clipDTO.startTime,
        clipDTO.duration,
        clipDTO.position,
        clipDTO.name
      );
      clip.id = clipDTO.id;
      clip.volume = clipDTO.volume;
      clip.pan = clipDTO.pan;
      clip.muted = clipDTO.muted;
      clip.soloed = clipDTO.soloed;
      clip.effects = clipDTO.effects;
      clip.automation = clipDTO.automation;
      clip.trackId = clipDTO.trackId;
      clip.createdAt = new Date(clipDTO.createdAt);
      clip.updatedAt = new Date(clipDTO.updatedAt);
      clip.version = clipDTO.version;
      return clip;
    });
    if (data.volume !== undefined) track.volume = data.volume;
    if (data.pan !== undefined) track.pan = data.pan;
    if (data.reverb !== undefined) track.reverb = data.reverb;
    await this.save(track);
    return track;
  }

  async getByName(name: string): Promise<TrackImpl[]> {
    const data = await this.storage.get<Record<string, TrackDTO>>(this.storageKey);
    if (!data) return [];
    return Object.values(data)
      .filter(dto => dto.name === name)
      .map(dto => this.toDomain(dto));
  }
} 