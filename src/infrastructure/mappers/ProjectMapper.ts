import type { Project } from '../../domain/models/Project';
import type { ProjectDTO } from '../../data/models/ProjectDTO';
import { ProjectImpl } from '../../domain/models/Project';
import { TrackMapper } from './TrackMapper';

export class ProjectMapper {
  static toDTO(project: Project): ProjectDTO {
    return {
      id: project.id,
      name: project.name,
      tempo: project.tempo,
      tracks: project.tracks.map(track => TrackMapper.toDTO(track)),
      isCurrent: project.isCurrent,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      version: project.version
    };
  }

  static toDomain(dto: ProjectDTO): Project {
    const project = new ProjectImpl(dto.name);
    project.id = dto.id;
    project.tempo = dto.tempo;
    project.tracks = dto.tracks.map(track => TrackMapper.toDomain(track));
    project.setCurrent(dto.isCurrent);
    project.createdAt = new Date(dto.createdAt);
    project.updatedAt = new Date(dto.updatedAt);
    project.version = dto.version;
    return project;
  }
} 