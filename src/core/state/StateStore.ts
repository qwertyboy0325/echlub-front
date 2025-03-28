/**
 * State Store
 * Manages application state
 */
export class StateStore {
    private static instance: StateStore | null = null;
    private state: Map<string, any> = new Map();
    
    private constructor() {}
    
    static getInstance(): StateStore {
        if (!StateStore.instance) {
            StateStore.instance = new StateStore();
        }
        return StateStore.instance;
    }
    
    setState(key: string, state: any): void {
        this.state.set(key, state);
    }
    
    getState(key: string): any {
        return this.state.get(key);
    }
    
    removeState(key: string): void {
        this.state.delete(key);
    }
    
    clear(): void {
        this.state.clear();
    }
    
    destroy(): void {
        this.clear();
        StateStore.instance = null;
    }
} 