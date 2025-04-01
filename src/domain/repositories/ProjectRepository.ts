import { injectable, inject } from 'inversify';
import type { Project } from '../models/Project';
import type { BaseRepository } from './BaseRepository';
import { TYPES } from '../../core/di/types';
import type { Storage } from '../../infrastructure/storage/Storage';

/**
 * Project repository interface
 */
export interface ProjectRepository extends BaseRepository<Project> {
  getCurrentProject(): Promise<Project | undefined>;
  createNewProject(name: string): Promise<Project>;
}

@injectable()
export class ProjectRepositoryImpl implements ProjectRepository {
  private projects: Map<string, Project> = new Map();
  private currentProjectId: string | null = null;

  constructor(
    @inject(TYPES.Storage) private storage: Storage
  ) {}

  public async add(project: Project): Promise<void> {
    this.projects.set(project.id, project);
    await this.saveToStorage();
  }

  public async get(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  public async getAll(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  public async update(project: Project): Promise<void> {
    if (!this.projects.has(project.id)) {
      throw new Error(`Project with id ${project.id} not found`);
    }
    this.projects.set(project.id, project);
    await this.saveToStorage();
  }

  public async delete(id: string): Promise<void> {
    if (this.currentProjectId === id) {
      this.currentProjectId = null;
    }
    this.projects.delete(id);
    await this.saveToStorage();
  }

  public async clear(): Promise<void> {
    this.projects.clear();
    this.currentProjectId = null;
    await this.saveToStorage();
  }

  public async getCurrentProject(): Promise<Project | undefined> {
    if (!this.currentProjectId) return undefined;
    return this.projects.get(this.currentProjectId);
  }

  public async createNewProject(name: string): Promise<Project> {
    const project: Project = {
      id: crypto.randomUUID(),
      name,
      bpm: 120,
      timeSignature: {
        numerator: 4,
        denominator: 4
      },
      tracks: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.add(project);
    this.currentProjectId = project.id;
    await this.saveToStorage();
    return project;
  }

  private async saveToStorage(): Promise<void> {
    const data = {
      projects: Array.from(this.projects.values()),
      currentProjectId: this.currentProjectId
    };
    await this.storage.set('projects', data);
  }

  private async loadFromStorage(): Promise<void> {
    const data = await this.storage.get<{
      projects: Project[];
      currentProjectId: string | null;
    }>('projects');

    if (data) {
      this.projects.clear();
      data.projects.forEach(project => this.projects.set(project.id, project));
      this.currentProjectId = data.currentProjectId;
    }
  }
} 