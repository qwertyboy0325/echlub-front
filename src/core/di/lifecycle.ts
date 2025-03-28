/**
 * Lifecycle hooks interface
 */
export interface LifecycleHooks {
    onInit(): void;
    onDestroy(): void;
}

/**
 * Base component with lifecycle hooks
 */
export class BaseComponent implements LifecycleHooks {
    onInit(): void {
        // 預設實作為空
    }
    
    onDestroy(): void {
        // 預設實作為空
    }
}

/**
 * Lifecycle manager for managing component lifecycles
 */
export class LifecycleManager {
    private static instance: LifecycleManager;
    private components: Set<LifecycleHooks> = new Set();
    
    private constructor() {
        // 初始化
    }
    
    static getInstance(): LifecycleManager {
        if (!LifecycleManager.instance) {
            LifecycleManager.instance = new LifecycleManager();
        }
        return LifecycleManager.instance;
    }
    
    /**
     * Register a component
     * @param component - Component to register
     */
    registerComponent(component: LifecycleHooks): void {
        this.components.add(component);
    }
    
    /**
     * Destroy all components
     */
    destroyAll(): void {
        this.components.forEach(component => {
            try {
                component.onDestroy();
            } catch (error) {
                console.error('Error destroying component:', error);
            }
        });
        this.components.clear();
    }
} 