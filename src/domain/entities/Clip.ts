export interface Clip {
    id: string;
    name: string;
    audioUrl: string;
    startTime: number;
    duration: number;
    position: number;
    volume: number;
    pan: number;
}

export class ClipEntity implements Clip {
    public readonly id: string;
    public name: string;
    public audioUrl: string;
    public startTime: number;
    public duration: number;
    public position: number;
    public volume: number;
    public pan: number;
    
    constructor(props: Omit<Clip, 'id'>) {
        this.id = crypto.randomUUID();
        this.name = props.name;
        this.audioUrl = props.audioUrl;
        this.startTime = props.startTime;
        this.duration = props.duration;
        this.position = props.position;
        this.volume = props.volume;
        this.pan = props.pan;
    }
    
    public updatePosition(position: number): void {
        this.position = Math.max(0, position);
    }
    
    public updateVolume(volume: number): void {
        this.volume = Math.max(0, Math.min(1, volume));
    }
    
    public updatePan(pan: number): void {
        this.pan = Math.max(-1, Math.min(1, pan));
    }
    
    public toJSON(): Clip {
        return {
            id: this.id,
            name: this.name,
            audioUrl: this.audioUrl,
            startTime: this.startTime,
            duration: this.duration,
            position: this.position,
            volume: this.volume,
            pan: this.pan
        };
    }
} 