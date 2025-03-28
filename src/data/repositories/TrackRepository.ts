import { Track, AudioClip, Effect } from '../models/Track';
import { TrackFactory } from '../models/Track';

/**
 * Track Repository
 * Manages track data persistence and retrieval
 */
export class TrackRepository {
    private tracks: Map<string, Track> = new Map();
    
    // Create new track
    createTrack(params: Partial<Track>): Track {
        const track = TrackFactory.createTrack(params);
        this.tracks.set(track.id, track);
        return track;
    }
    
    // Get track by ID
    getTrack(id: string): Track | undefined {
        return this.tracks.get(id);
    }
    
    // Get all tracks
    getAllTracks(): Track[] {
        return Array.from(this.tracks.values());
    }
    
    // Update track
    updateTrack(id: string, updates: Partial<Track>): Track | undefined {
        const track = this.tracks.get(id);
        if (!track) return undefined;
        
        const updatedTrack = TrackFactory.updateTrack(track, updates);
        this.tracks.set(id, updatedTrack);
        return updatedTrack;
    }
    
    // Delete track
    deleteTrack(id: string): boolean {
        return this.tracks.delete(id);
    }
    
    // Add clip to track
    addClip(trackId: string, clip: AudioClip): Track | undefined {
        const track = this.tracks.get(trackId);
        if (!track) return undefined;
        
        const updatedTrack = TrackFactory.updateTrack(track, {
            clips: [...track.clips, clip]
        });
        
        this.tracks.set(trackId, updatedTrack);
        return updatedTrack;
    }
    
    // Remove clip from track
    removeClip(trackId: string, clipId: string): Track | undefined {
        const track = this.tracks.get(trackId);
        if (!track) return undefined;
        
        const updatedTrack = TrackFactory.updateTrack(track, {
            clips: track.clips.filter(clip => clip.id !== clipId)
        });
        
        this.tracks.set(trackId, updatedTrack);
        return updatedTrack;
    }
    
    // Add effect to track
    addEffect(trackId: string, effect: Effect): Track | undefined {
        const track = this.tracks.get(trackId);
        if (!track) return undefined;
        
        const updatedTrack = TrackFactory.updateTrack(track, {
            effects: [...track.effects, effect]
        });
        
        this.tracks.set(trackId, updatedTrack);
        return updatedTrack;
    }
    
    // Remove effect from track
    removeEffect(trackId: string, effectId: string): Track | undefined {
        const track = this.tracks.get(trackId);
        if (!track) return undefined;
        
        const updatedTrack = TrackFactory.updateTrack(track, {
            effects: track.effects.filter(effect => effect.id !== effectId)
        });
        
        this.tracks.set(trackId, updatedTrack);
        return updatedTrack;
    }
    
    // Update clip in track
    updateClip(trackId: string, clipId: string, updates: Partial<AudioClip>): Track | undefined {
        const track = this.tracks.get(trackId);
        if (!track) return undefined;
        
        const updatedTrack = TrackFactory.updateTrack(track, {
            clips: track.clips.map(clip =>
                clip.id === clipId
                    ? TrackFactory.updateAudioClip(clip, updates)
                    : clip
            )
        });
        
        this.tracks.set(trackId, updatedTrack);
        return updatedTrack;
    }
    
    // Update effect in track
    updateEffect(trackId: string, effectId: string, updates: Partial<Effect>): Track | undefined {
        const track = this.tracks.get(trackId);
        if (!track) return undefined;
        
        const updatedTrack = TrackFactory.updateTrack(track, {
            effects: track.effects.map(effect =>
                effect.id === effectId
                    ? TrackFactory.updateEffect(effect, updates)
                    : effect
            )
        });
        
        this.tracks.set(trackId, updatedTrack);
        return updatedTrack;
    }
    
    // Clear all tracks
    clear(): void {
        this.tracks.clear();
    }
} 