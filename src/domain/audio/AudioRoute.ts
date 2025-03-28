import { BaseServiceImpl } from '../../core/services/BaseService';
import { ErrorHandler } from '../../core/error/ErrorHandler';

/**
 * Audio Route
 * Manages audio signal routing between nodes
 */
export class AudioRoute extends BaseServiceImpl {
    private static instance: AudioRoute | null = null;
    private context: AudioContext;
    private routes: Map<string, AudioNode[]> = new Map();
    private connections: Map<string, Set<string>> = new Map();
    
    private isInitializedFlag: boolean = false;
    
    private constructor() {
        super();
        this.context = new AudioContext();
    }
    
    static getInstance(): AudioRoute {
        if (!AudioRoute.instance) {
            AudioRoute.instance = new AudioRoute();
        }
        return AudioRoute.instance;
    }
    
    protected setup(): void {
        try {
            // Initialize routing system
            this.initRoutingSystem();
            this.isInitializedFlag = true;
        } catch (error) {
            ErrorHandler.getInstance().handleError(error as Error);
        }
    }
    
    protected cleanup(): void {
        try {
            // Disconnect all routes if initialized
            if (this.isInitializedFlag) {
                this.disconnectAll();
            }
            
            // Close audio context
            this.context.close();
            
            // Reset state
            this.routes.clear();
            this.connections.clear();
            this.isInitializedFlag = false;
        } catch (error) {
            ErrorHandler.getInstance().handleError(error as Error);
        }
    }
    
    // Destroy instance
    destroy(): void {
        this.cleanup();
        AudioRoute.instance = null;
    }
    
    // Create route
    createRoute(id: string, nodes: AudioNode[]): void {
        try {
            // Store route
            this.routes.set(id, nodes);
            
            // Initialize connections set
            this.connections.set(id, new Set());
            
            // Connect nodes in sequence
            for (let i = 0; i < nodes.length - 1; i++) {
                nodes[i].connect(nodes[i + 1]);
            }
        } catch (error) {
            ErrorHandler.getInstance().handleError(error as Error);
        }
    }
    
    // Connect routes
    connectRoutes(fromId: string, toId: string): void {
        const fromRoute = this.routes.get(fromId);
        const toRoute = this.routes.get(toId);
        
        if (!fromRoute || !toRoute) {
            throw new Error('Route not found');
        }
        
        try {
            // Connect last node of from route to first node of to route
            fromRoute[fromRoute.length - 1].connect(toRoute[0]);
            
            // Store connection
            this.connections.get(fromId)?.add(toId);
        } catch (error) {
            ErrorHandler.getInstance().handleError(error as Error);
        }
    }
    
    // Disconnect routes
    disconnectRoutes(fromId: string, toId: string): void {
        const fromRoute = this.routes.get(fromId);
        const toRoute = this.routes.get(toId);
        
        if (!fromRoute || !toRoute) {
            throw new Error('Route not found');
        }
        
        try {
            // Disconnect last node of from route from first node of to route
            fromRoute[fromRoute.length - 1].disconnect(toRoute[0]);
            
            // Remove connection
            this.connections.get(fromId)?.delete(toId);
        } catch (error) {
            ErrorHandler.getInstance().handleError(error as Error);
        }
    }
    
    // Insert node into route
    insertNode(routeId: string, node: AudioNode, index: number): void {
        const route = this.routes.get(routeId);
        if (!route) {
            throw new Error('Route not found');
        }
        
        try {
            // Insert node at specified index
            route.splice(index, 0, node);
            
            // Reconnect nodes
            this.reconnectRoute(routeId);
        } catch (error) {
            ErrorHandler.getInstance().handleError(error as Error);
        }
    }
    
    // Remove node from route
    removeNode(routeId: string, index: number): void {
        const route = this.routes.get(routeId);
        if (!route) {
            throw new Error('Route not found');
        }
        
        try {
            // Remove node at specified index
            route.splice(index, 1);
            
            // Reconnect nodes
            this.reconnectRoute(routeId);
        } catch (error) {
            ErrorHandler.getInstance().handleError(error as Error);
        }
    }
    
    // Get route nodes
    getRouteNodes(routeId: string): AudioNode[] | undefined {
        return this.routes.get(routeId);
    }
    
    // Get route connections
    getRouteConnections(routeId: string): string[] {
        return Array.from(this.connections.get(routeId) || []);
    }
    
    // Disconnect all routes
    disconnectAll(): void {
        try {
            // Clear all connections
            this.connections.clear();
            
            // Clear all routes
            this.routes.clear();
        } catch (error) {
            ErrorHandler.getInstance().handleError(error as Error);
        }
    }
    
    // Reconnect route nodes
    private reconnectRoute(routeId: string): void {
        const route = this.routes.get(routeId);
        if (!route) return;
        
        // Disconnect all nodes
        for (const node of route) {
            node.disconnect();
        }
        
        // Reconnect nodes in sequence
        for (let i = 0; i < route.length - 1; i++) {
            route[i].connect(route[i + 1]);
        }
        
        // Reconnect to connected routes
        const connections = this.connections.get(routeId);
        if (connections) {
            for (const toId of connections) {
                const toRoute = this.routes.get(toId);
                if (toRoute) {
                    route[route.length - 1].connect(toRoute[0]);
                }
            }
        }
    }
    
    // Initialize routing system
    private initRoutingSystem(): void {
        // Create default routes
        this.createRoute('master', [
            this.context.createGain(),
            this.context.destination
        ]);
    }

    // Check if initialized
    isInitialized(): boolean {
        return this.isInitializedFlag;
    }
} 