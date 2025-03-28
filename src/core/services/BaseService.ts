/**
 * Base Service Interface
 * Defines common lifecycle methods for all services
 */
export interface BaseService {
    initialize(): void;
    destroy(): void;
    isInitialized(): boolean;
}

/**
 * Base Service Implementation
 * Provides default implementation of BaseService interface
 */
export abstract class BaseServiceImpl implements BaseService {
    private initialized: boolean = false;
    
    initialize(): void {
        if (this.initialized) return;
        this.setup();
        this.initialized = true;
    }
    
    destroy(): void {
        if (!this.initialized) return;
        this.cleanup();
        this.initialized = false;
    }
    
    isInitialized(): boolean {
        return this.initialized;
    }
    
    protected abstract setup(): void;
    protected abstract cleanup(): void;
} 