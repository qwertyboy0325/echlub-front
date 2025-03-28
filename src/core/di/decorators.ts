/**
 * Injectable options interface
 */
export interface InjectableOptions {
    singleton?: boolean;
    dependencies?: string[];
}

/**
 * Service registration decorator
 * @param options - Injectable options
 */
export function Injectable(options: InjectableOptions = {}): ClassDecorator {
    return (target: any) => {
        Reflect.defineMetadata('injectable', true, target);
        Reflect.defineMetadata('singleton', options.singleton || false, target);
        Reflect.defineMetadata('dependencies', options.dependencies || [], target);
    };
}

/**
 * Dependency injection decorator
 * @param token - Service token
 */
export function Inject(token: string): PropertyDecorator {
    return (target: any, propertyKey: string | symbol) => {
        const dependencies = Reflect.getMetadata('dependencies', target.constructor) || [];
        dependencies.push({ token, propertyKey });
        Reflect.defineMetadata('dependencies', dependencies, target.constructor);
    };
}

/**
 * Factory registration decorator
 */
export function InjectableFactory(): MethodDecorator {
    return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
        Reflect.defineMetadata('factory', true, descriptor.value);
        return descriptor;
    };
}

/**
 * Get metadata for a class
 * @param target - Class constructor
 * @param key - Metadata key
 */
export function getMetadata<T>(target: any, key: string): T | undefined {
    return Reflect.getMetadata(key, target);
}

/**
 * Check if a class is injectable
 * @param target - Class constructor
 */
export function isInjectable(target: any): boolean {
    return getMetadata<boolean>('injectable', target) || false;
}

/**
 * Check if a class is singleton
 * @param target - Class constructor
 */
export function isSingleton(target: any): boolean {
    return getMetadata<boolean>('singleton', target) || false;
}

/**
 * Get class dependencies
 * @param target - Class constructor
 */
export function getDependencies(target: any): Array<{ token: string; propertyKey: string | symbol }> {
    return getMetadata<Array<{ token: string; propertyKey: string | symbol }>>('dependencies', target) || [];
} 