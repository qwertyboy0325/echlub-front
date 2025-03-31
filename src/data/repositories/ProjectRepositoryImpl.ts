import { injectable } from 'inversify';
import type { Project } from '../../domain/models/Project';
import type { ProjectRepository } from '../../domain/repositories/ProjectRepository';
import type { ProjectDTO } from '../models/ProjectDTO';
import { BaseRepositoryImpl } from './BaseRepositoryImpl';
import { ProjectMapper } from '../../infrastructure/mappers/ProjectMapper';
import { ProjectImpl } from '../../domain/models/Project';
import type { Storage } from '../../infrastructure/storage/Storage';

@injectable()
export class ProjectRepositoryImpl extends BaseRepositoryImpl<ProjectImpl, ProjectDTO> implements ProjectRepository {
  constructor(storage: Storage) {
    super(storage, 'project_storage');
  }

  protected toDTO(entity: ProjectImpl): ProjectDTO {
    return ProjectMapper.toDTO(entity);
  }

  protected toDomain(dto: ProjectDTO): ProjectImpl {
    return ProjectMapper.toDomain(dto);
  }

  async getCurrentProject(): Promise<ProjectImpl | null> {
    const data = await this.storage.get<Record<string, ProjectDTO>>(this.storageKey);
    if (!data) return null;

    const projects = Object.values(data)
      .map(dto => this.toDomain(dto))
      .filter(project => project.isCurrent);

    return projects.length > 0 ? projects[0] : null;
  }

  async createNewProject(name: string): Promise<ProjectImpl> {
    const data = await this.storage.get<Record<string, ProjectDTO>>(this.storageKey) || {};
    
    // Set all existing projects as not current
    Object.values(data).forEach(dto => {
      dto.isCurrent = false;
    });

    const project = new ProjectImpl(name);
    project.setCurrent(true);
    const dto = this.toDTO(project);
    data[project.id] = dto;
    
    await this.storage.set(this.storageKey, data);
    return project;
  }
} 