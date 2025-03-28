import { Track } from './Track';

/**
 * Project Model
 * Represents a DAW project
 */
export interface Project {
    id: string;
    name: string;
    description: string;
    tracks: Track[];
    bpm: number;
    timeSignature: {
        numerator: number;
        denominator: number;
    };
    sampleRate: number;
    createdAt: number;
    updatedAt: number;
}

/**
 * Project Factory
 * Creates and manages project instances
 */
export class ProjectFactory {
    // Create new project
    static createProject(params: Partial<Project>): Project {
        const now = Date.now();
        return {
            id: params.id || crypto.randomUUID(),
            name: params.name || 'New Project',
            description: params.description || '',
            tracks: params.tracks || [],
            bpm: params.bpm ?? 120,
            timeSignature: params.timeSignature || {
                numerator: 4,
                denominator: 4
            },
            sampleRate: params.sampleRate ?? 44100,
            createdAt: params.createdAt || now,
            updatedAt: now
        };
    }
    
    // Update project
    static updateProject(project: Project, updates: Partial<Project>): Project {
        return {
            ...project,
            ...updates,
            updatedAt: Date.now()
        };
    }
    
    // Add track to project
    static addTrack(project: Project, track: Track): Project {
        return this.updateProject(project, {
            tracks: [...project.tracks, track]
        });
    }
    
    // Remove track from project
    static removeTrack(project: Project, trackId: string): Project {
        return this.updateProject(project, {
            tracks: project.tracks.filter(track => track.id !== trackId)
        });
    }
    
    // Update track in project
    static updateTrack(project: Project, trackId: string, updates: Partial<Track>): Project {
        return this.updateProject(project, {
            tracks: project.tracks.map(track =>
                track.id === trackId
                    ? { ...track, ...updates, updatedAt: Date.now() }
                    : track
            )
        });
    }
    
    // Get track by ID
    static getTrack(project: Project, trackId: string): Track | undefined {
        return project.tracks.find(track => track.id === trackId);
    }
    
    // Get track index by ID
    static getTrackIndex(project: Project, trackId: string): number {
        return project.tracks.findIndex(track => track.id === trackId);
    }
    
    // Move track in project
    static moveTrack(project: Project, trackId: string, newIndex: number): Project {
        const tracks = [...project.tracks];
        const currentIndex = this.getTrackIndex(project, trackId);
        
        if (currentIndex === -1) {
            return project;
        }
        
        const [track] = tracks.splice(currentIndex, 1);
        tracks.splice(newIndex, 0, track);
        
        return this.updateProject(project, { tracks });
    }
} 