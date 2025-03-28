/**
 * Service Scope Enum
 * Defines the lifetime of a service in the DI container
 */
export enum ServiceScope {
    /**
     * Singleton scope - one instance per container
     */
    Singleton = 'singleton',

    /**
     * Transient scope - new instance each time
     */
    Transient = 'transient',

    /**
     * Factory scope - new instance from factory each time
     */
    Factory = 'factory'
} 