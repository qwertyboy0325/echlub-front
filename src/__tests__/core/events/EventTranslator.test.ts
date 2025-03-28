import { EventTranslator } from '../../../core/events/EventTranslator';
import { Event } from '../../../core/events/Event';
import { ErrorHandler } from '../../../core/error/ErrorHandler';

describe('EventTranslator', () => {
    let eventTranslator: EventTranslator;
    let errorHandler: ErrorHandler;
    let errorListener: jest.Mock;
    
    beforeEach(() => {
        eventTranslator = EventTranslator.getInstance();
        eventTranslator.destroy(); // Clear translations before each test
        errorHandler = ErrorHandler.getInstance();
        errorListener = jest.fn();
        errorHandler.addListener(errorListener);
    });
    
    afterEach(() => {
        errorHandler.removeListener(errorListener);
    });
    
    describe('Singleton Pattern', () => {
        test('should maintain single instance', () => {
            const instance1 = EventTranslator.getInstance();
            const instance2 = EventTranslator.getInstance();
            
            expect(instance1).toBe(instance2);
        });
    });
    
    describe('Event Translation', () => {
        test('should translate UI event to domain event', () => {
            const uiEvent = new Event('ui:click', { button: 'submit' });
            const domainEvent = new Event('domain:formSubmitted', { formId: 'test-form' });
            
            eventTranslator.addTranslation('ui:click', 'domain:formSubmitted', (event) => {
                return new Event('domain:formSubmitted', { formId: 'test-form' });
            });
            
            const translatedEvent = eventTranslator.translate(uiEvent);
            
            expect(translatedEvent).toBeDefined();
            expect(translatedEvent?.type).toBe('domain:formSubmitted');
            expect(translatedEvent?.data).toEqual({ formId: 'test-form' });
        });
        
        test('should translate domain event to UI event', () => {
            const domainEvent = new Event('domain:dataUpdated', { id: 123, value: 'new' });
            const uiEvent = new Event('ui:refresh', { elementId: 'data-123' });
            
            eventTranslator.addTranslation('domain:dataUpdated', 'ui:refresh', (event) => {
                return new Event('ui:refresh', { elementId: `data-${event.data.id}` });
            });
            
            const translatedEvent = eventTranslator.translate(domainEvent);
            
            expect(translatedEvent).toBeDefined();
            expect(translatedEvent?.type).toBe('ui:refresh');
            expect(translatedEvent?.data).toEqual({ elementId: 'data-123' });
        });
        
        test('should handle multiple translations for same event type', () => {
            const sourceEvent = new Event('source:event', { value: 'test' });
            const targetEvent1 = new Event('target1:event', { value: 'test1' });
            const targetEvent2 = new Event('target2:event', { value: 'test2' });
            
            eventTranslator.addTranslation('source:event', 'target1:event', (event) => {
                return new Event('target1:event', { value: 'test1' });
            });
            
            eventTranslator.addTranslation('source:event', 'target2:event', (event) => {
                return new Event('target2:event', { value: 'test2' });
            });
            
            const translatedEvents = eventTranslator.translate(sourceEvent);
            
            expect(translatedEvents).toBeDefined();
            expect(translatedEvents?.length).toBe(2);
            expect(translatedEvents?.[0].type).toBe('target1:event');
            expect(translatedEvents?.[1].type).toBe('target2:event');
        });
        
        test('should handle non-existent translations', () => {
            const event = new Event('unknown:event', { data: 'test' });
            
            const translatedEvent = eventTranslator.translate(event);
            
            expect(translatedEvent).toBeUndefined();
        });
        
        test('should handle translation errors gracefully', () => {
            const event = new Event('test:event', { data: 'test' });
            
            eventTranslator.addTranslation('test:event', 'target:event', () => {
                throw new Error('Translation error');
            });
            
            const translatedEvent = eventTranslator.translate(event);
            
            expect(translatedEvent).toBeUndefined();
            expect(errorListener).toHaveBeenCalledWith(expect.any(Error));
            expect(errorListener.mock.calls[0][0].message).toBe('Translation error');
        });
    });
    
    describe('Translation Management', () => {
        test('should remove translations', () => {
            const event = new Event('test:event', { data: 'test' });
            
            eventTranslator.addTranslation('test:event', 'target:event', (event) => {
                return new Event('target:event', { data: event.data });
            });
            
            eventTranslator.removeTranslation('test:event', 'target:event');
            
            const translatedEvent = eventTranslator.translate(event);
            
            expect(translatedEvent).toBeUndefined();
        });
        
        test('should handle complex event data translation', () => {
            const sourceEvent = new Event('source:event', {
                user: { id: 1, name: 'Test User' },
                action: 'update',
                timestamp: Date.now()
            });
            
            eventTranslator.addTranslation('source:event', 'target:event', (event) => {
                return new Event('target:event', {
                    userId: event.data.user.id,
                    actionType: event.data.action,
                    time: event.data.timestamp
                });
            });
            
            const translatedEvent = eventTranslator.translate(sourceEvent);
            
            expect(translatedEvent).toBeDefined();
            expect(translatedEvent?.type).toBe('target:event');
            expect(translatedEvent?.data).toEqual({
                userId: 1,
                actionType: 'update',
                time: expect.any(Number)
            });
        });
    });
}); 