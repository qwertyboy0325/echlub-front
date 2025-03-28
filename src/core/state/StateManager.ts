import { StateSlice } from './StateSlice';

/**
 * State Manager
 * Manages state slices
 */
export class StateManager {
    private static instance: StateManager | null = null;
    private slices: Map<string, StateSlice<any>> = new Map();
    
    private constructor() {}
    
    static getInstance(): StateManager {
        if (!StateManager.instance) {
            StateManager.instance = new StateManager();
        }
        return StateManager.instance;
    }
    
    registerSlice<T extends object>(name: string, slice: StateSlice<T>): void {
        this.slices.set(name, slice);
    }
    
    unregisterSlice(name: string): void {
        this.slices.delete(name);
    }
    
    getSlice<T extends object>(name: string): StateSlice<T> | undefined {
        return this.slices.get(name) as StateSlice<T> | undefined;
    }
    
    destroy(): void {
        this.slices.clear();
        StateManager.instance = null;
    }
} 