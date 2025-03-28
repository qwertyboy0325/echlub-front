import '../../../__tests__/mocks/WebAudioAPI';
import { AudioRoute } from '../../../domain/audio/AudioRoute';

describe('AudioRoute', () => {
    let audioRoute: AudioRoute;
    
    beforeEach(() => {
        audioRoute = AudioRoute.getInstance();
    });
    
    afterEach(() => {
        audioRoute.destroy();
    });
    
    test('should be singleton', () => {
        const instance1 = AudioRoute.getInstance();
        const instance2 = AudioRoute.getInstance();
        
        expect(instance1).toBe(instance2);
    });
    
    test('should initialize with default values', () => {
        expect(audioRoute.isInitialized()).toBe(false);
        audioRoute.initialize();
        expect(audioRoute.isInitialized()).toBe(true);
    });
    
    test('should create and manage routes', () => {
        audioRoute.initialize();
        
        // Create test nodes
        const gainNode = new GainNode(new AudioContext());
        const delayNode = new DelayNode(new AudioContext());
        
        // Create route
        audioRoute.createRoute('test-route', [gainNode, delayNode]);
        
        // Get route nodes
        const nodes = audioRoute.getRouteNodes('test-route');
        expect(nodes).toBeDefined();
        expect(nodes?.length).toBe(2);
        expect(nodes?.[0]).toBe(gainNode);
        expect(nodes?.[1]).toBe(delayNode);
    });
    
    test('should connect and disconnect routes', () => {
        audioRoute.initialize();
        
        // Create test routes
        const route1Nodes = [new GainNode(new AudioContext())];
        const route2Nodes = [new GainNode(new AudioContext())];
        
        audioRoute.createRoute('route1', route1Nodes);
        audioRoute.createRoute('route2', route2Nodes);
        
        // Connect routes
        audioRoute.connectRoutes('route1', 'route2');
        expect(audioRoute.getRouteConnections('route1')).toContain('route2');
        
        // Disconnect routes
        audioRoute.disconnectRoutes('route1', 'route2');
        expect(audioRoute.getRouteConnections('route1')).not.toContain('route2');
    });
    
    test('should insert and remove nodes', () => {
        audioRoute.initialize();
        
        // Create initial route
        const gainNode = new GainNode(new AudioContext());
        audioRoute.createRoute('test-route', [gainNode]);
        
        // Insert node
        const delayNode = new DelayNode(new AudioContext());
        audioRoute.insertNode('test-route', delayNode, 1);
        
        const nodes = audioRoute.getRouteNodes('test-route');
        expect(nodes?.length).toBe(2);
        expect(nodes?.[1]).toBe(delayNode);
        
        // Remove node
        audioRoute.removeNode('test-route', 1);
        expect(audioRoute.getRouteNodes('test-route')?.length).toBe(1);
    });
    
    test('should handle cleanup', () => {
        audioRoute.initialize();
        audioRoute.destroy();
        expect(audioRoute.isInitialized()).toBe(false);
    });
    
    test('should handle errors gracefully', () => {
        audioRoute.initialize();
        
        // Test with non-existent route
        expect(() => {
            audioRoute.connectRoutes('non-existent', 'route2');
        }).toThrow('Route not found');
    });
}); 