import { Project } from '../models/Project';
import { ProjectFactory } from '../models/Project';
import { Track } from '../models/Track';

/**
 * Project Repository
 * Manages project data persistence and retrieval
 */
export class ProjectRepository {
    private projects: Map<string, Project> = new Map();
    
    // Create new project
    createProject(params: Partial<Project>): Project {
        const project = ProjectFactory.createProject(params);
        this.projects.set(project.id, project);
        return project;
    }
    
    // Get project by ID
    getProject(id: string): Project | undefined {
        return this.projects.get(id);
    }
    
    // Get all projects
    getAllProjects(): Project[] {
        return Array.from(this.projects.values());
    }
    
    // Update project
    updateProject(id: string, updates: Partial<Project>): Project | undefined {
        const project = this.projects.get(id);
        if (!project) return undefined;
        
        const updatedProject = ProjectFactory.updateProject(project, updates);
        this.projects.set(id, updatedProject);
        return updatedProject;
    }
    
    // Delete project
    deleteProject(id: string): boolean {
        return this.projects.delete(id);
    }
    
    // Add track to project
    addTrack(projectId: string, track: Track): Project | undefined {
        const project = this.projects.get(projectId);
        if (!project) return undefined;
        
        const updatedProject = ProjectFactory.addTrack(project, track);
        this.projects.set(projectId, updatedProject);
        return updatedProject;
    }
    
    // Remove track from project
    removeTrack(projectId: string, trackId: string): Project | undefined {
        const project = this.projects.get(projectId);
        if (!project) return undefined;
        
        const updatedProject = ProjectFactory.removeTrack(project, trackId);
        this.projects.set(projectId, updatedProject);
        return updatedProject;
    }
    
    // Update track in project
    updateTrack(projectId: string, trackId: string, updates: Partial<Track>): Project | undefined {
        const project = this.projects.get(projectId);
        if (!project) return undefined;
        
        const updatedProject = ProjectFactory.updateTrack(project, trackId, updates);
        this.projects.set(projectId, updatedProject);
        return updatedProject;
    }
    
    // Get track by ID
    getTrack(projectId: string, trackId: string): Track | undefined {
        const project = this.projects.get(projectId);
        if (!project) return undefined;
        
        return ProjectFactory.getTrack(project, trackId);
    }
    
    // Move track in project
    moveTrack(projectId: string, trackId: string, newIndex: number): Project | undefined {
        const project = this.projects.get(projectId);
        if (!project) return undefined;
        
        const updatedProject = ProjectFactory.moveTrack(project, trackId, newIndex);
        this.projects.set(projectId, updatedProject);
        return updatedProject;
    }
    
    // Update project BPM
    updateBPM(projectId: string, bpm: number): Project | undefined {
        return this.updateProject(projectId, { bpm });
    }
    
    // Update project time signature
    updateTimeSignature(
        projectId: string,
        numerator: number,
        denominator: number
    ): Project | undefined {
        return this.updateProject(projectId, {
            timeSignature: { numerator, denominator }
        });
    }
    
    // Update project sample rate
    updateSampleRate(projectId: string, sampleRate: number): Project | undefined {
        return this.updateProject(projectId, { sampleRate });
    }
    
    // Clear all projects
    clear(): void {
        this.projects.clear();
    }
} 