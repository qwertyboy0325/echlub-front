import { BaseModel, BaseModelImpl } from './BaseModel';
import { Track } from './Track';
import { UUIDGenerator } from '../../utils/uuid';

/**
 * Project model interface
 */
export interface Project extends BaseModel {
    name: string;
    description: string;
    tracks: string[];
    tempo: number;
    timeSignature: [number, number];
    sampleRate: number;
    bitDepth: number;
    startTime: number;
    endTime: number;
    loopStart: number;
    loopEnd: number;
    markers: Record<string, number>;
    metadata: Record<string, unknown>;
    version: number;
}

/**
 * Project model implementation
 */
export class ProjectImpl extends BaseModelImpl implements Project {
    name: string;
    description: string;
    tracks: string[];
    tempo: number;
    timeSignature: [number, number];
    sampleRate: number;
    bitDepth: number;
    startTime: number;
    endTime: number;
    loopStart: number;
    loopEnd: number;
    markers: Record<string, number>;
    metadata: Record<string, unknown>;
    version: number;

    constructor(data: Partial<Project>) {
        super(data);
        this.name = data.name || 'Untitled Project';
        this.description = data.description || '';
        this.tracks = data.tracks || [];
        this.tempo = data.tempo || 120;
        this.timeSignature = data.timeSignature || [4, 4];
        this.sampleRate = data.sampleRate || 44100;
        this.bitDepth = data.bitDepth || 24;
        this.startTime = data.startTime || 0;
        this.endTime = data.endTime || 0;
        this.loopStart = data.loopStart || 0;
        this.loopEnd = data.loopEnd || 0;
        this.markers = data.markers || {};
        this.metadata = data.metadata || {};
        this.version = data.version || 1;
    }

    /**
     * Add track to project
     */
    addTrack(trackId: string): void {
        if (!this.tracks.includes(trackId)) {
            this.tracks.push(trackId);
            this.update();
        }
    }

    /**
     * Remove track from project
     */
    removeTrack(trackId: string): void {
        this.tracks = this.tracks.filter(id => id !== trackId);
        this.update();
    }

    /**
     * Update project tempo
     */
    updateTempo(tempo: number): void {
        this.tempo = Math.max(1, Math.min(999, tempo));
        this.update();
    }

    /**
     * Update project time signature
     */
    updateTimeSignature(numerator: number, denominator: number): void {
        this.timeSignature = [numerator, denominator];
        this.update();
    }

    /**
     * Update project sample rate
     */
    updateSampleRate(sampleRate: number): void {
        this.sampleRate = sampleRate;
        this.update();
    }

    /**
     * Update project bit depth
     */
    updateBitDepth(bitDepth: number): void {
        this.bitDepth = bitDepth;
        this.update();
    }

    /**
     * Update project time range
     */
    updateTimeRange(startTime: number, endTime: number): void {
        this.startTime = Math.max(0, startTime);
        this.endTime = Math.max(this.startTime, endTime);
        this.update();
    }

    /**
     * Update project loop points
     */
    updateLoopPoints(start: number, end: number): void {
        this.loopStart = Math.max(0, start);
        this.loopEnd = Math.max(this.loopStart, end);
        this.update();
    }

    /**
     * Add marker to project
     */
    addMarker(name: string, time: number): void {
        this.markers[name] = Math.max(0, time);
        this.update();
    }

    /**
     * Remove marker from project
     */
    removeMarker(name: string): void {
        delete this.markers[name];
        this.update();
    }

    /**
     * Update project metadata
     */
    updateMetadata(metadata: Record<string, unknown>): void {
        this.metadata = { ...this.metadata, ...metadata };
        this.update();
    }
}

/**
 * Project Factory
 * Creates and manages project instances
 */
export class ProjectFactory {
    // Create new project
    static createProject(params: Partial<Project>): Project {
        const now = new Date();
        return {
            id: params.id || UUIDGenerator.generate(),
            name: params.name || 'New Project',
            description: params.description || '',
            tracks: params.tracks || [],
            tempo: params.tempo ?? 120,
            timeSignature: params.timeSignature || [4, 4],
            sampleRate: params.sampleRate ?? 44100,
            bitDepth: params.bitDepth || 24,
            startTime: params.startTime || 0,
            endTime: params.endTime || 0,
            loopStart: params.loopStart || 0,
            loopEnd: params.loopEnd || 0,
            markers: params.markers || {},
            metadata: params.metadata || {},
            createdAt: params.createdAt || now,
            updatedAt: now,
            version: params.version || 1
        };
    }
    
    // Update project
    static updateProject(project: Project, updates: Partial<Project>): Project {
        return {
            ...project,
            ...updates,
            updatedAt: new Date(),
            version: (project.version || 0) + 1
        };
    }
    
    // Add track to project
    static addTrack(project: Project, track: Track): Project {
        return this.updateProject(project, {
            tracks: [...project.tracks, track.id]
        });
    }
    
    // Remove track from project
    static removeTrack(project: Project, trackId: string): Project {
        return this.updateProject(project, {
            tracks: project.tracks.filter(id => id !== trackId)
        });
    }
    
    // Update track in project
    static updateTrack(project: Project, trackId: string, updates: Partial<Track>): Project {
        // Since we only store track IDs in the project, we can't update the track content here
        // This method should be moved to the TrackRepository
        return project;
    }
    
    // Get track by ID
    static getTrack(project: Project, trackId: string): string | undefined {
        return project.tracks.find(id => id === trackId);
    }
    
    // Get track index by ID
    static getTrackIndex(project: Project, trackId: string): number {
        return project.tracks.findIndex(id => id === trackId);
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