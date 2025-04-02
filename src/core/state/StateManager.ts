import { injectable, inject } from 'inversify';
import { TYPES } from '../di/types';
import { DomainEventBus } from '../events/DomainEventBus';
import { Track } from '../../domain/entities/Track';

export interface DAWState {
    tracks: Track[];
    transport: {
        state: 'playing' | 'paused' | 'stopped';
        currentTime: number;
        bpm: number;
    };
    timeline: {
        zoom: number;
        scrollPosition: number;
    };
}

@injectable()
export class StateManager {
    private state: DAWState;
    private subscribers: Set<(state: DAWState) => void> = new Set();
    
    constructor(
        @inject(TYPES.DomainEventBus) private domainEventBus: DomainEventBus
    ) {
        this.state = this.getInitialState();
        this.setupEventHandlers();
    }
    
    private getInitialState(): DAWState {
        return {
            tracks: [],
            transport: {
                state: 'stopped',
                currentTime: 0,
                bpm: 120
            },
            timeline: {
                zoom: 1,
                scrollPosition: 0
            }
        };
    }
    
    private setupEventHandlers(): void {
        this.domainEventBus.on('domain:track:created', this.handleTrackCreated);
        this.domainEventBus.on('domain:track:deleted', this.handleTrackDeleted);
        this.domainEventBus.on('domain:transport:state:changed', this.handleTransportStateChanged);
        this.domainEventBus.on('domain:transport:bpm:changed', this.handleTransportBpmChanged);
    }
    
    subscribe(callback: (state: DAWState) => void): () => void {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }
    
    getState(): DAWState {
        return { ...this.state };
    }
    
    updateState(updater: (state: DAWState) => DAWState): void {
        this.state = updater(this.state);
        this.notifySubscribers();
    }
    
    private notifySubscribers(): void {
        this.subscribers.forEach(callback => callback(this.state));
    }
    
    private handleTrackCreated = (payload: { track: Track }): void => {
        this.updateState(state => ({
            ...state,
            tracks: [...state.tracks, payload.track]
        }));
    };
    
    private handleTrackDeleted = (payload: { trackId: string }): void => {
        this.updateState(state => ({
            ...state,
            tracks: state.tracks.filter(track => track.id !== payload.trackId)
        }));
    };
    
    private handleTransportStateChanged = (payload: { state: 'playing' | 'paused' | 'stopped' }): void => {
        this.updateState(state => ({
            ...state,
            transport: {
                ...state.transport,
                state: payload.state
            }
        }));
    };
    
    private handleTransportBpmChanged = (payload: { bpm: number }): void => {
        this.updateState(state => ({
            ...state,
            transport: {
                ...state.transport,
                bpm: payload.bpm
            }
        }));
    };
} 