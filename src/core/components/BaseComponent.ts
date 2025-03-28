/**
 * Base Component Interface
 * Defines common lifecycle methods for all components
 */
export interface BaseComponent {
    mount(): void;
    unmount(): void;
    isMounted(): boolean;
    update(): void;
}

/**
 * Base Component Implementation
 * Provides default implementation of BaseComponent interface
 */
export abstract class BaseComponentImpl implements BaseComponent {
    private mounted: boolean = false;
    
    mount(): void {
        if (this.mounted) return;
        this.onMount();
        this.mounted = true;
    }
    
    unmount(): void {
        if (!this.mounted) return;
        this.onUnmount();
        this.mounted = false;
    }
    
    isMounted(): boolean {
        return this.mounted;
    }
    
    update(): void {
        if (!this.mounted) return;
        this.onUpdate();
    }
    
    protected abstract onMount(): void;
    protected abstract onUnmount(): void;
    protected abstract onUpdate(): void;
} 