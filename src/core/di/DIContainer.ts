import { ServiceScope } from './ServiceScope';
import { InjectableOptions, isInjectable, isSingleton, getDependencies } from './decorators';
import { LifecycleHooks, LifecycleManager } from './lifecycle';

type Provider<T> = {
    useClass: new (...args: any[]) => T;
    dependencies?: string[];
};

type Factory<T> = (container: DIContainer) => T;

type ServiceRegistration = {
    implementation: any;
    scope: ServiceScope;
    instance?: any;
};

/**
 * Dependency Injection Container
 * Manages service registration and resolution
 */
export class DIContainer {
    private services: Map<string, ServiceRegistration> = new Map();
    private resolutionStack: Set<string> = new Set();
    private lifecycleManager: LifecycleManager;

    constructor() {
        this.lifecycleManager = LifecycleManager.getInstance();
    }

    /**
     * Register a service in the container
     * @param token - Service identifier
     * @param implementation - Service implementation (class or factory)
     * @param scope - Service lifetime scope
     */
    register(token: string, implementation: any, scope: ServiceScope): void {
        if (!implementation) {
            throw new Error('Invalid service registration');
        }

        this.services.set(token, {
            implementation,
            scope
        });
    }

    /**
     * Register a singleton service
     * @param token - Service identifier
     * @param implementation - Service implementation
     */
    registerSingleton<T>(token: string, implementation: new (...args: any[]) => T): void {
        this.register(token, implementation, ServiceScope.Singleton);
    }

    /**
     * Register a factory service
     * @param token - Service identifier
     * @param factory - Factory function
     */
    registerFactory<T>(token: string, factory: Factory<T>): void {
        this.services.set(token, {
            implementation: factory,
            scope: ServiceScope.Factory
        });
    }

    /**
     * Resolve a service from the container
     * @param token - Service identifier
     * @returns Service instance
     */
    resolve<T>(token: string): T {
        const registration = this.services.get(token);
        if (!registration) {
            throw new Error(`Service ${token} not registered`);
        }

        // Check for circular dependencies
        if (this.resolutionStack.has(token)) {
            throw new Error('Circular dependency detected');
        }

        this.resolutionStack.add(token);

        try {
            let instance: T;
            switch (registration.scope) {
                case ServiceScope.Singleton:
                    if (!registration.instance) {
                        registration.instance = this.createInstance(registration.implementation);
                        if (this.isLifecycleComponent(registration.instance)) {
                            this.lifecycleManager.registerComponent(registration.instance);
                            (registration.instance as LifecycleHooks).onInit();
                        }
                    }
                    instance = registration.instance;
                    break;

                case ServiceScope.Transient:
                    instance = this.createInstance(registration.implementation);
                    if (this.isLifecycleComponent(instance)) {
                        this.lifecycleManager.registerComponent(instance);
                        (instance as LifecycleHooks).onInit();
                    }
                    break;

                case ServiceScope.Factory:
                    instance = registration.implementation(this);
                    if (this.isLifecycleComponent(instance)) {
                        this.lifecycleManager.registerComponent(instance);
                        (instance as LifecycleHooks).onInit();
                    }
                    break;

                default:
                    throw new Error(`Unknown service scope: ${registration.scope}`);
            }
            return instance;
        } finally {
            this.resolutionStack.delete(token);
        }
    }

    /**
     * Check if a service exists
     * @param token - Service identifier
     */
    has(token: string): boolean {
        return this.services.has(token);
    }

    /**
     * Destroy the container and clear all services
     */
    destroy(): void {
        this.services.clear();
        this.resolutionStack.clear();
        this.lifecycleManager.destroyAll();
    }

    /**
     * Create a new instance of a service
     * @param implementation - Service implementation
     * @returns New service instance
     */
    private createInstance(implementation: any): any {
        try {
            // 嘗試獲取依賴，如果失敗則使用空陣列
            let dependencies: string[] = [];
            try {
                dependencies = this.getDependencies(implementation);
            } catch (error) {
                // 忽略錯誤，使用空依賴陣列
            }

            const resolvedDependencies = dependencies.map(dep => this.resolve(dep));
            return new implementation(...resolvedDependencies);
        } catch (error: unknown) {
            if (error instanceof Error) {
                throw new Error(`Failed to create instance: ${error.message}`);
            }
            throw new Error('Failed to create instance: Unknown error');
        }
    }

    /**
     * Get dependencies for a service
     * @param implementation - Service implementation
     */
    private getDependencies(implementation: any): string[] {
        try {
            if (isInjectable(implementation)) {
                return getDependencies(implementation).map(dep => dep.token);
            }
        } catch (error) {
            // 忽略錯誤，返回空陣列
        }
        return [];
    }

    /**
     * Check if an instance implements lifecycle hooks
     * @param instance - Service instance
     */
    private isLifecycleComponent(instance: any): instance is LifecycleHooks {
        return Boolean(instance) && 
               typeof instance.onInit === 'function' && 
               typeof instance.onDestroy === 'function';
    }
} 