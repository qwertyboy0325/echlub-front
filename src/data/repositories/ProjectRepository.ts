import { BaseRepository, BaseRepositoryImpl } from './BaseRepository';
import { Project, ProjectImpl } from '../models/Project';
import { Track } from '../models/Track';

/**
 * Project repository interface
 */
export interface ProjectRepository extends BaseRepository<Project> {
  /**
   * Get projects by name
   */
  getByName(name: string): Project[];

  /**
   * Get active project
   */
  getActive(): Project | undefined;

  /**
   * Set active project
   */
  setActive(id: string): void;

  /**
   * Get projects with specific tempo
   */
  getByTempo(tempo: number): Project[];

  /**
   * Get projects with specific time signature
   */
  getByTimeSignature(numerator: number, denominator: number): Project[];
}

/**
 * Project repository implementation
 */
export class ProjectRepositoryImpl extends BaseRepositoryImpl<Project> implements ProjectRepository {
  private activeProjectId: string | undefined;

  protected createItem(data: Partial<Project>): Project {
    return new ProjectImpl(data);
  }

  protected updateItem(existing: Project, data: Partial<Project>): Project {
    return new ProjectImpl({
      ...existing,
      ...data,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
      version: existing.version + 1
    });
  }

  getByName(name: string): Project[] {
    return this.getAll().filter(project => project.name === name);
  }

  getActive(): Project | undefined {
    if (!this.activeProjectId) {
      return undefined;
    }
    return this.getById(this.activeProjectId);
  }

  setActive(id: string): void {
    if (this.exists(id)) {
      this.activeProjectId = id;
    }
  }

  getByTempo(tempo: number): Project[] {
    return this.getAll().filter(project => project.tempo === tempo);
  }

  getByTimeSignature(numerator: number, denominator: number): Project[] {
    return this.getAll().filter(project => 
      project.timeSignature[0] === numerator && 
      project.timeSignature[1] === denominator
    );
  }

  /**
   * Override delete to handle active project
   */
  delete(id: string): boolean {
    if (this.activeProjectId === id) {
      this.activeProjectId = undefined;
    }
    return super.delete(id);
  }

  /**
   * Override clear to handle active project
   */
  clear(): void {
    this.activeProjectId = undefined;
    super.clear();
  }

  // Add track to project
  addTrack(projectId: string, track: Track): Project | undefined {
    const project = this.getById(projectId);
    if (!project) return undefined;
    
    const updatedProject = ProjectFactory.addTrack(project, track);
    this.update(updatedProject);
    return updatedProject;
  }
  
  // Remove track from project
  removeTrack(projectId: string, trackId: string): Project | undefined {
    const project = this.getById(projectId);
    if (!project) return undefined;
    
    const updatedProject = ProjectFactory.removeTrack(project, trackId);
    this.update(updatedProject);
    return updatedProject;
  }
  
  // Update track in project
  updateTrack(projectId: string, trackId: string, updates: Partial<Track>): Project | undefined {
    const project = this.getById(projectId);
    if (!project) return undefined;
    
    const updatedProject = ProjectFactory.updateTrack(project, trackId, updates);
    this.update(updatedProject);
    return updatedProject;
  }
  
  // Get track by ID
  getTrack(projectId: string, trackId: string): Track | undefined {
    const project = this.getById(projectId);
    if (!project) return undefined;
    
    return ProjectFactory.getTrack(project, trackId);
  }
  
  // Move track in project
  moveTrack(projectId: string, trackId: string, newIndex: number): Project | undefined {
    const project = this.getById(projectId);
    if (!project) return undefined;
    
    const updatedProject = ProjectFactory.moveTrack(project, trackId, newIndex);
    this.update(updatedProject);
    return updatedProject;
  }
  
  // Update project BPM
  updateBPM(projectId: string, bpm: number): Project | undefined {
    return this.update(projectId, { bpm });
  }
  
  // Update project time signature
  updateTimeSignature(
    projectId: string,
    numerator: number,
    denominator: number
  ): Project | undefined {
    return this.update(projectId, {
      timeSignature: { numerator, denominator }
    });
  }
  
  // Update project sample rate
  updateSampleRate(projectId: string, sampleRate: number): Project | undefined {
    return this.update(projectId, { sampleRate });
  }
} 