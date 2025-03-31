import type { Project } from '../models/Project';
import type { BaseRepository } from './BaseRepository';

/**
 * Project repository interface
 */
export interface ProjectRepository extends BaseRepository<Project> {
  getCurrentProject(): Promise<Project | null>;
  createNewProject(name: string): Promise<Project>;
} 