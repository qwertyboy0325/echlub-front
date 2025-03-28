/**
 * Track Model
 * Represents an audio track in the DAW
 */
export interface Track {
    id: string;
    name: string;
    type: 'audio' | 'midi' | 'instrument';
    volume: number;
    pan: number;
    muted: boolean;
    soloed: boolean;
    clips: AudioClip[];
    effects: Effect[];
    createdAt: number;
    updatedAt: number;
}

/**
 * Audio Clip Model
 * Represents an audio clip in a track
 */
export interface AudioClip {
    id: string;
    trackId: string;
    name: string;
    startTime: number;
    duration: number;
    loop: boolean;
    loopStart: number;
    loopEnd: number;
    audioData: AudioData;
    createdAt: number;
    updatedAt: number;
}

/**
 * Audio Data Model
 * Represents the actual audio data
 */
export interface AudioData {
    buffer: Float32Array;
    sampleRate: number;
    channels: number;
    duration: number;
}

/**
 * Effect Model
 * Represents an audio effect
 */
export interface Effect {
    id: string;
    type: string;
    parameters: Record<string, number>;
    enabled: boolean;
    createdAt: number;
    updatedAt: number;
}

/**
 * Track Factory
 * Creates and manages track instances
 */
export class TrackFactory {
    // Create new track
    static createTrack(params: Partial<Track>): Track {
        const now = Date.now();
        return {
            id: params.id || crypto.randomUUID(),
            name: params.name || 'New Track',
            type: params.type || 'audio',
            volume: params.volume ?? 1,
            pan: params.pan ?? 0,
            muted: params.muted ?? false,
            soloed: params.soloed ?? false,
            clips: params.clips || [],
            effects: params.effects || [],
            createdAt: params.createdAt || now,
            updatedAt: now
        };
    }
    
    // Create new audio clip
    static createAudioClip(params: Partial<AudioClip>): AudioClip {
        const now = Date.now();
        return {
            id: params.id || crypto.randomUUID(),
            trackId: params.trackId || '',
            name: params.name || 'New Clip',
            startTime: params.startTime ?? 0,
            duration: params.duration ?? 0,
            loop: params.loop ?? false,
            loopStart: params.loopStart ?? 0,
            loopEnd: params.loopEnd ?? 0,
            audioData: params.audioData || {
                buffer: new Float32Array(),
                sampleRate: 44100,
                channels: 2,
                duration: 0
            },
            createdAt: params.createdAt || now,
            updatedAt: now
        };
    }
    
    // Create new effect
    static createEffect(params: Partial<Effect>): Effect {
        const now = Date.now();
        return {
            id: params.id || crypto.randomUUID(),
            type: params.type || '',
            parameters: params.parameters || {},
            enabled: params.enabled ?? true,
            createdAt: params.createdAt || now,
            updatedAt: now
        };
    }
    
    // Update track
    static updateTrack(track: Track, updates: Partial<Track>): Track {
        return {
            ...track,
            ...updates,
            updatedAt: Date.now()
        };
    }
    
    // Update audio clip
    static updateAudioClip(clip: AudioClip, updates: Partial<AudioClip>): AudioClip {
        return {
            ...clip,
            ...updates,
            updatedAt: Date.now()
        };
    }
    
    // Update effect
    static updateEffect(effect: Effect, updates: Partial<Effect>): Effect {
        return {
            ...effect,
            ...updates,
            updatedAt: Date.now()
        };
    }
} 