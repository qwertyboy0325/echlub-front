import { EventLogService } from '../../../core/events/EventLogService';
import { Event } from '../../../core/events/Event';

describe('EventLogService', () => {
    let eventLogService: EventLogService;
    
    beforeEach(() => {
        eventLogService = EventLogService.getInstance();
        eventLogService.clear();
    });
    
    test('should be singleton', () => {
        const instance1 = EventLogService.getInstance();
        const instance2 = EventLogService.getInstance();
        
        expect(instance1).toBe(instance2);
    });
    
    test('should log events', () => {
        const event = new Event('test', { data: 'test data' });
        
        eventLogService.log(event);
        
        const logs = eventLogService.getLogs();
        expect(logs).toHaveLength(1);
        expect(logs[0].event).toBe(event);
        expect(logs[0].timestamp).toBeDefined();
    });
    
    test('should filter logs by event type', () => {
        const event1 = new Event('type1', { data: 'test data 1' });
        const event2 = new Event('type2', { data: 'test data 2' });
        
        eventLogService.log(event1);
        eventLogService.log(event2);
        
        const logs = eventLogService.getLogsByType('type1');
        expect(logs).toHaveLength(1);
        expect(logs[0].event.type).toBe('type1');
    });
    
    test('should filter logs by time range', () => {
        const event = new Event('test', { data: 'test data' });
        
        eventLogService.log(event);
        
        const now = Date.now();
        const logs = eventLogService.getLogsByTimeRange(now - 1000, now + 1000);
        expect(logs).toHaveLength(1);
        expect(logs[0].event).toBe(event);
    });
    
    test('should clear logs', () => {
        const event = new Event('test', { data: 'test data' });
        
        eventLogService.log(event);
        eventLogService.clear();
        
        const logs = eventLogService.getLogs();
        expect(logs).toHaveLength(0);
    });
    
    test('should limit log size', () => {
        const maxSize = 5;
        eventLogService.setMaxSize(maxSize);
        
        for (let i = 0; i < maxSize + 5; i++) {
            eventLogService.log(new Event('test', { data: `test data ${i}` }));
        }
        
        const logs = eventLogService.getLogs();
        expect(logs).toHaveLength(maxSize);
    });
}); 