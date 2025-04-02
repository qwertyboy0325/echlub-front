import { Clip } from './Clip';

export interface Track {
    id: string;
    name: string;
    volume: number;
    pan: number;
    muted: boolean;
    soloed: boolean;
    clips: Clip[];
}

export class TrackEntity implements Track {
    public readonly id: string;
    public name: string;
    public volume: number;
    public pan: number;
    public muted: boolean;
    public soloed: boolean;
    public clips: Clip[];
    
    constructor(props: Omit<Track, 'id'>) {
        this.id = crypto.randomUUID();
        this.name = props.name;
        this.volume = props.volume;
        this.pan = props.pan;
        this.muted = props.muted;
        this.soloed = props.soloed;
        this.clips = props.clips;
    }
    
    public updateVolume(volume: number): void {
        this.volume = Math.max(0, Math.min(1, volume));
    }
    
    public updatePan(pan: number): void {
        this.pan = Math.max(-1, Math.min(1, pan));
    }
    
    public toggleMute(): void {
        this.muted = !this.muted;
    }
    
    public toggleSolo(): void {
        this.soloed = !this.soloed;
    }
    
    public addClip(clip: Clip): void {
        this.clips.push(clip);
    }
    
    public removeClip(clipId: string): void {
        this.clips = this.clips.filter(clip => clip.id !== clipId);
    }
    
    public getClips(): Clip[] {
        return [...this.clips];
    }
    
    public toJSON(): Track {
        return {
            id: this.id,
            name: this.name,
            volume: this.volume,
            pan: this.pan,
            muted: this.muted,
            soloed: this.soloed,
            clips: this.clips.map(clip => clip.toJSON())
        };
    }
} 