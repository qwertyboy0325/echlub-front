import { EventFilter } from '../../../core/events/EventFilter';
import { Event } from '../../../core/events/Event';

describe('EventFilter', () => {
    let eventFilter: EventFilter;
    
    beforeEach(() => {
        eventFilter = EventFilter.getInstance();
        eventFilter.destroy(); // Clear filters before each test
    });
    
    test('should be singleton', () => {
        const instance1 = EventFilter.getInstance();
        const instance2 = EventFilter.getInstance();
        
        expect(instance1).toBe(instance2);
    });
    
    test('should filter UI events', () => {
        const event = new Event('ui:playback:start', { data: 'test data' });
        
        eventFilter.addFilter('ui:playback:start', (event) => {
            return event.data.data === 'test data';
        });
        
        const shouldProcess = eventFilter.shouldProcess(event);
        expect(shouldProcess).toBe(true);
    });
    
    test('should filter domain events', () => {
        const event = new Event('domain:track:added', { 
            track: { id: 'track-1', type: 'audio' }
        });
        
        eventFilter.addFilter('domain:track:added', (event) => {
            return event.data.track.type === 'audio';
        });
        
        const shouldProcess = eventFilter.shouldProcess(event);
        expect(shouldProcess).toBe(true);
    });
    
    test('should filter out events based on data', () => {
        const event = new Event('ui:track:add', {
            trackId: 'track-1',
            type: 'audio',
            volume: 0
        });
        
        eventFilter.addFilter('ui:track:add', (event) => {
            return event.data.volume > 0;
        });
        
        const shouldProcess = eventFilter.shouldProcess(event);
        expect(shouldProcess).toBe(false);
    });
    
    test('should handle multiple filters for same event type', () => {
        const event = new Event('ui:clip:move', {
            clipId: 'clip-1',
            newPosition: 100,
            trackId: 'track-1'
        });
        
        eventFilter.addFilter('ui:clip:move', (event) => {
            return event.data.newPosition >= 0;
        });
        
        eventFilter.addFilter('ui:clip:move', (event) => {
            return event.data.trackId !== undefined;
        });
        
        const shouldProcess = eventFilter.shouldProcess(event);
        expect(shouldProcess).toBe(true);
    });
    
    test('should handle non-existent filters', () => {
        const event = new Event('ui:unknown:event', { data: 'test data' });
        
        const shouldProcess = eventFilter.shouldProcess(event);
        expect(shouldProcess).toBe(true);
    });
    
    test('should remove filters', () => {
        const event = new Event('ui:playback:start', { data: 'test data' });
        
        eventFilter.addFilter('ui:playback:start', (event) => {
            return event.data.data === 'test data';
        });
        
        eventFilter.removeFilter('ui:playback:start');
        
        const shouldProcess = eventFilter.shouldProcess(event);
        expect(shouldProcess).toBe(true);
    });
    
    test('should handle filter errors gracefully', () => {
        const event = new Event('ui:playback:start', { data: 'test data' });
        
        eventFilter.addFilter('ui:playback:start', (event) => {
            throw new Error('Filter error');
        });
        
        const shouldProcess = eventFilter.shouldProcess(event);
        expect(shouldProcess).toBe(false);
    });
    
    test('should handle complex event filtering', () => {
        const event = new Event('domain:track:added', {
            track: {
                id: 'track-1',
                type: 'audio',
                name: 'New Track',
                volume: 1,
                pan: 0,
                muted: false,
                soloed: false,
                color: '#000000',
                clips: [],
                effects: [],
                automation: []
            }
        });
        
        eventFilter.addFilter('domain:track:added', (event) => {
            const track = event.data.track;
            return (
                track.type === 'audio' &&
                track.volume > 0 &&
                !track.muted &&
                !track.soloed &&
                track.clips.length === 0 &&
                track.effects.length === 0 &&
                track.automation.length === 0
            );
        });
        
        const shouldProcess = eventFilter.shouldProcess(event);
        expect(shouldProcess).toBe(true);
    });
}); 