import { EventBus } from '../../../core/events/EventBus';
import { Event } from '../../../core/events/Event';
import { ErrorHandler } from '../../../core/error/ErrorHandler';
import { EventPriority } from '../../../core/events/EventBus';

// Define test event types
interface TestEvents {
    test: { data: string };
    test2: { value: number };
}

describe('EventBus', () => {
    let eventBus: EventBus<TestEvents>;
    let errorHandler: ErrorHandler;
    let errorListener: jest.Mock;
    
    beforeEach(() => {
        eventBus = EventBus.getInstance<TestEvents>();
        eventBus.destroy(); // Clear subscriptions before each test
        errorHandler = ErrorHandler.getInstance();
        errorListener = jest.fn();
        errorHandler.addListener(errorListener);
    });
    
    afterEach(() => {
        errorHandler.removeListener(errorListener);
    });
    
    describe('Singleton Pattern', () => {
        test('should maintain single instance', () => {
            const instance1 = EventBus.getInstance<TestEvents>();
            const instance2 = EventBus.getInstance<TestEvents>();
            
            expect(instance1).toBe(instance2);
        });
    });
    
    describe('Event Emission and Reception', () => {
        test('should emit and receive events', () => {
            const listener = jest.fn();
            
            eventBus.subscribe('test', listener);
            eventBus.emit('test', { data: 'test data' });
            
            expect(listener).toHaveBeenCalledWith(expect.any(Event));
            expect(listener.mock.calls[0][0].data).toEqual({ data: 'test data' });
        });
        
        test('should handle event data correctly', () => {
            const data = { data: 'test data' };
            const listener = jest.fn();
            
            eventBus.subscribe('test', listener);
            eventBus.emit('test', data);
            
            expect(listener).toHaveBeenCalledWith(expect.any(Event));
            expect(listener.mock.calls[0][0].data).toEqual(data);
        });
    });
    
    describe('Subscription Management', () => {
        test('should unsubscribe from events', () => {
            const listener = jest.fn();
            
            eventBus.subscribe('test', listener);
            eventBus.unsubscribe('test', listener);
            eventBus.emit('test', { data: 'test data' });
            
            expect(listener).not.toHaveBeenCalled();
        });
        
        test('should handle multiple listeners', () => {
            const listener1 = jest.fn();
            const listener2 = jest.fn();
            
            eventBus.subscribe('test', listener1);
            eventBus.subscribe('test', listener2);
            eventBus.emit('test', { data: 'test data' });
            
            expect(listener1).toHaveBeenCalledWith(expect.any(Event));
            expect(listener2).toHaveBeenCalledWith(expect.any(Event));
        });
        
        test('should handle multiple event types', () => {
            const listener1 = jest.fn();
            const listener2 = jest.fn();
            
            eventBus.subscribe('test', listener1);
            eventBus.subscribe('test2', listener2);
            
            eventBus.emit('test', { data: 'test data' });
            eventBus.emit('test2', { value: 42 });
            
            expect(listener1).toHaveBeenCalledWith(expect.any(Event));
            expect(listener2).toHaveBeenCalledWith(expect.any(Event));
        });
    });
    
    describe('Error Handling', () => {
        test('should handle listener errors gracefully', () => {
            const listener = jest.fn().mockImplementation(() => {
                throw new Error('Listener error');
            });
            
            eventBus.subscribe('test', listener);
            eventBus.emit('test', { data: 'test data' });
            
            expect(errorListener).toHaveBeenCalledWith(expect.any(Error));
            expect(errorListener.mock.calls[0][0].message).toBe('Listener error');
        });
        
        test('should handle non-existent event types', () => {
            const listener = jest.fn();
            
            eventBus.subscribe('unknown' as keyof TestEvents, listener);
            eventBus.emit('unknown' as keyof TestEvents, { data: 'test data' });
            
            expect(listener).toHaveBeenCalledWith(expect.any(Event));
        });
    });
    
    describe('Event Flow', () => {
        test('should maintain event order', () => {
            const listener = jest.fn();
            
            eventBus.subscribe('test', listener);
            
            eventBus.emit('test', { data: 'first' });
            eventBus.emit('test', { data: 'second' });
            eventBus.emit('test', { data: 'third' });
            
            expect(listener).toHaveBeenCalledTimes(3);
            expect(listener.mock.calls[0][0].data).toEqual({ data: 'first' });
            expect(listener.mock.calls[1][0].data).toEqual({ data: 'second' });
            expect(listener.mock.calls[2][0].data).toEqual({ data: 'third' });
        });
        
        test('should handle rapid event emission', () => {
            const listener = jest.fn();
            
            eventBus.subscribe('test', listener);
            
            for (let i = 0; i < 100; i++) {
                eventBus.emit('test', { data: `test ${i}` });
            }
            
            expect(listener).toHaveBeenCalledTimes(100);
        });
    });
}); 