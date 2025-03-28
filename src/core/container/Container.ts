/**
 * Dependency Injection Container
 * Implements singleton pattern for managing service instances
 */
export class Container {
    private static instance: Container;
    private services: Map<string, any> = new Map();
    private factories: Map<string, () => any> = new Map();
    
    private constructor() {}
    
    static getInstance(): Container {
        if (!Container.instance) {
            Container.instance = new Container();
        }
        return Container.instance;
    }
    
    // Register singleton service
    register<T>(key: string, service: T): void {
        this.services.set(key, service);
    }
    
    // Register factory function
    registerFactory<T>(key: string, factory: () => T): void {
        this.factories.set(key, factory);
    }
    
    // Get service instance
    get<T>(key: string): T {
        if (this.services.has(key)) {
            return this.services.get(key);
        }
        if (this.factories.has(key)) {
            const service = this.factories.get(key)!();
            this.services.set(key, service);
            return service;
        }
        throw new Error(`Service ${key} not found`);
    }
    
    // Check if service exists
    has(key: string): boolean {
        return this.services.has(key) || this.factories.has(key);
    }
    
    // Remove service
    remove(key: string): void {
        this.services.delete(key);
        this.factories.delete(key);
    }
    
    // Clear all services
    clear(): void {
        this.services.clear();
        this.factories.clear();
    }
} 