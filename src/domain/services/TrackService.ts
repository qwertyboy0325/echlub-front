import { injectable, inject } from 'inversify';
import { TYPES } from '../../core/di/types';
import { TrackRepository } from '../repositories/TrackRepository';
import { DomainEventBus } from '../../core/events/DomainEventBus';
import { Track } from '../entities/Track';

@injectable()
export class TrackService {
    constructor(
        @inject(TYPES.TrackRepository) private trackRepository: TrackRepository,
        @inject(TYPES.DomainEventBus) private domainEventBus: DomainEventBus
    ) {}
    
    async createTrack(name: string): Promise<Track> {
        const track = await this.trackRepository.create({
            name,
            volume: 1,
            pan: 0,
            muted: false,
            soloed: false
        });
        
        this.domainEventBus.emit('domain:track:created', { track });
        return track;
    }
    
    async deleteTrack(trackId: string): Promise<void> {
        await this.trackRepository.delete(trackId);
        this.domainEventBus.emit('domain:track:deleted', { trackId });
    }
    
    async updateTrackVolume(trackId: string, volume: number): Promise<void> {
        const track = await this.trackRepository.findById(trackId);
        if (!track) {
            throw new Error(`Track not found: ${trackId}`);
        }
        
        await this.trackRepository.update(trackId, {
            ...track,
            volume
        });
        
        this.domainEventBus.emit('domain:track:updated', {
            trackId,
            changes: { volume }
        });
    }
    
    async updateTrackPan(trackId: string, pan: number): Promise<void> {
        const track = await this.trackRepository.findById(trackId);
        if (!track) {
            throw new Error(`Track not found: ${trackId}`);
        }
        
        await this.trackRepository.update(trackId, {
            ...track,
            pan
        });
        
        this.domainEventBus.emit('domain:track:updated', {
            trackId,
            changes: { pan }
        });
    }
    
    async toggleTrackMute(trackId: string): Promise<void> {
        const track = await this.trackRepository.findById(trackId);
        if (!track) {
            throw new Error(`Track not found: ${trackId}`);
        }
        
        await this.trackRepository.update(trackId, {
            ...track,
            muted: !track.muted
        });
        
        this.domainEventBus.emit('domain:track:updated', {
            trackId,
            changes: { muted: !track.muted }
        });
    }
    
    async toggleTrackSolo(trackId: string): Promise<void> {
        const track = await this.trackRepository.findById(trackId);
        if (!track) {
            throw new Error(`Track not found: ${trackId}`);
        }
        
        await this.trackRepository.update(trackId, {
            ...track,
            soloed: !track.soloed
        });
        
        this.domainEventBus.emit('domain:track:updated', {
            trackId,
            changes: { soloed: !track.soloed }
        });
    }
    
    async getTracks(): Promise<Track[]> {
        return this.trackRepository.findAll();
    }
    
    async getTrackById(trackId: string): Promise<Track | null> {
        return this.trackRepository.findById(trackId);
    }
} 