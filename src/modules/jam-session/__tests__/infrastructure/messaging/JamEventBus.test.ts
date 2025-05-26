import { JamEventBus } from '../../../infrastructure/messaging/JamEventBus';
import { SignalingService } from '@/modules/collaboration/domain/interfaces/SignalingService';
import { IntegrationEventBus } from '@/core/event-bus/IntegrationEventBus';
import { CollaborationEvent } from '@/modules/collaboration/domain/events/CollaborationEvent';

// Mock dependencies
const mockSignalingService = {
  on: jest.fn(),
  sendMessage: jest.fn().mockResolvedValue(undefined),
  off: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
  isConnected: jest.fn(),
  sendOffer: jest.fn(),
  sendAnswer: jest.fn(),
  sendIceCandidate: jest.fn(),
  sendReconnectRequest: jest.fn(),
  getConnectionState: jest.fn()
} as unknown as jest.Mocked<SignalingService>;

const mockEventBus = {
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  publish: jest.fn().mockResolvedValue(undefined),
  subscribeToNamespace: jest.fn(),
  unsubscribeFromNamespace: jest.fn()
} as unknown as jest.Mocked<IntegrationEventBus>;

describe('JamEventBus', () => {
  let jamEventBus: JamEventBus;
  let signalingMessageHandler: (message: string) => void;
  let collaborationEventHandler: (event: CollaborationEvent) => Promise<void>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Capture the handlers passed to mocked services
    mockSignalingService.on.mockImplementation((event: string, handler: any) => {
      if (event === 'message') {
        signalingMessageHandler = handler;
      }
    });
    
    mockEventBus.subscribe.mockImplementation((eventType: string, handler: any) => {
      if (eventType === 'CollaborationEvent') {
        collaborationEventHandler = handler;
      }
    });
    
    jamEventBus = new JamEventBus(mockSignalingService, mockEventBus);
  });

  describe('constructor', () => {
    it('should subscribe to signaling service messages', () => {
      expect(mockSignalingService.on).toHaveBeenCalledWith('message', expect.any(Function));
    });

    it('should subscribe to collaboration events', () => {
      expect(mockEventBus.subscribe).toHaveBeenCalledWith('CollaborationEvent', expect.any(Function));
    });
  });

  describe('publish', () => {
    it('should send message through signaling service', async () => {
      const eventType = 'jam.session-created';
      const payload = { sessionId: 'session-123', roomId: 'room-456' };

      await jamEventBus.publish(eventType, payload);

      expect(mockSignalingService.sendMessage).toHaveBeenCalledWith(
        expect.stringContaining(eventType)
      );
      
      const sentMessage = mockSignalingService.sendMessage.mock.calls[0][0];
      const parsedMessage = JSON.parse(sentMessage);
      
      expect(parsedMessage.type).toBe(eventType);
      expect(parsedMessage.payload).toEqual(payload);
      expect(parsedMessage.meta).toHaveProperty('timestamp');
      expect(parsedMessage.meta).toHaveProperty('eventId');
    });

    it('should include metadata in published events', async () => {
      const eventType = 'jam.player-ready';
      const payload = { peerId: 'peer-123', isReady: true };

      await jamEventBus.publish(eventType, payload);

      const sentMessage = mockSignalingService.sendMessage.mock.calls[0][0];
      const parsedMessage = JSON.parse(sentMessage);
      
      expect(parsedMessage.meta.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(parsedMessage.meta.eventId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should trigger local event handlers after publishing', async () => {
      const eventType = 'jam.round-started';
      const payload = { roundNumber: 1 };
      const handler = jest.fn();

      jamEventBus.subscribe(eventType, handler);
      await jamEventBus.publish(eventType, payload);

      expect(handler).toHaveBeenCalledWith(payload);
    });
  });

  describe('subscribe', () => {
    it('should register event handler for specific event type', () => {
      const eventType = 'jam.session-started';
      const handler = jest.fn();

      jamEventBus.subscribe(eventType, handler);

      // Simulate incoming event
      const message = JSON.stringify({
        type: eventType,
        payload: { sessionId: 'session-123' }
      });
      
      signalingMessageHandler(message);

      expect(handler).toHaveBeenCalledWith({ sessionId: 'session-123' });
    });

    it('should support multiple handlers for same event type', () => {
      const eventType = 'jam.player-joined';
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      const payload = { peerId: 'peer-123' };

      jamEventBus.subscribe(eventType, handler1);
      jamEventBus.subscribe(eventType, handler2);

      const message = JSON.stringify({ type: eventType, payload });
      signalingMessageHandler(message);

      expect(handler1).toHaveBeenCalledWith(payload);
      expect(handler2).toHaveBeenCalledWith(payload);
    });

    it('should handle different event types independently', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      jamEventBus.subscribe('jam.session-started', handler1);
      jamEventBus.subscribe('jam.session-ended', handler2);

      const message1 = JSON.stringify({
        type: 'jam.session-started',
        payload: { sessionId: 'session-123' }
      });
      
      const message2 = JSON.stringify({
        type: 'jam.session-ended',
        payload: { sessionId: 'session-456' }
      });

      signalingMessageHandler(message1);
      signalingMessageHandler(message2);

      expect(handler1).toHaveBeenCalledWith({ sessionId: 'session-123' });
      expect(handler2).toHaveBeenCalledWith({ sessionId: 'session-456' });
    });
  });

  describe('unsubscribe', () => {
    it('should remove specific handler from event type', () => {
      const eventType = 'jam.round-ended';
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      jamEventBus.subscribe(eventType, handler1);
      jamEventBus.subscribe(eventType, handler2);
      jamEventBus.unsubscribe(eventType, handler1);

      const message = JSON.stringify({
        type: eventType,
        payload: { roundNumber: 1 }
      });
      
      signalingMessageHandler(message);

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledWith({ roundNumber: 1 });
    });

    it('should handle unsubscribing non-existent handler gracefully', () => {
      const eventType = 'jam.player-left';
      const handler = jest.fn();

      expect(() => {
        jamEventBus.unsubscribe(eventType, handler);
      }).not.toThrow();
    });

    it('should handle unsubscribing from non-existent event type gracefully', () => {
      const handler = jest.fn();

      expect(() => {
        jamEventBus.unsubscribe('non-existent-event', handler);
      }).not.toThrow();
    });
  });

  describe('message handling', () => {
    it('should parse and handle valid JSON messages', () => {
      const handler = jest.fn();
      const eventType = 'jam.test-event';
      const payload = { data: 'test' };

      jamEventBus.subscribe(eventType, handler);

      const message = JSON.stringify({ type: eventType, payload });
      signalingMessageHandler(message);

      expect(handler).toHaveBeenCalledWith(payload);
    });

    it('should handle invalid JSON messages gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const invalidMessage = 'invalid json {';
      
      expect(() => {
        signalingMessageHandler(invalidMessage);
      }).not.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith('Error processing message:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should handle handler errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const faultyHandler = jest.fn().mockImplementation(() => {
        throw new Error('Handler error');
      });

      jamEventBus.subscribe('jam.test-event', faultyHandler);

      const message = JSON.stringify({
        type: 'jam.test-event',
        payload: { data: 'test' }
      });
      
      signalingMessageHandler(message);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error in handler for event jam.test-event:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('collaboration event handling', () => {
    it('should handle collaboration events for jam-session channel', async () => {
      const handler = jest.fn();
      jamEventBus.subscribe('jam.collaboration-event', handler);

      const collaborationEvent = {
        eventType: 'CollaborationEvent',
        eventId: 'event-123',
        timestamp: new Date().toISOString(),
        payload: {
          channel: 'jam-session',
          sender: 'peer-123',
          data: {
            type: 'jam.collaboration-event',
            sessionId: 'session-123'
          }
        }
      } as any;

      await collaborationEventHandler(collaborationEvent);

      expect(handler).toHaveBeenCalledWith({
        type: 'jam.collaboration-event',
        sessionId: 'session-123'
      });
    });

    it('should ignore collaboration events for other channels', async () => {
      const handler = jest.fn();
      jamEventBus.subscribe('jam.other-event', handler);

      const collaborationEvent = {
        eventType: 'CollaborationEvent',
        eventId: 'event-123',
        timestamp: new Date().toISOString(),
        payload: {
          channel: 'other-channel',
          sender: 'peer-123',
          data: {
            type: 'jam.other-event',
            sessionId: 'session-123'
          }
        }
      } as any;

      await collaborationEventHandler(collaborationEvent);

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle signaling service errors gracefully', async () => {
      mockSignalingService.sendMessage.mockRejectedValue(new Error('Network error'));

      await expect(jamEventBus.publish('jam.test-event', {})).rejects.toThrow('Network error');
    });

    it('should continue processing other handlers if one fails', () => {
      const workingHandler = jest.fn();
      const faultyHandler = jest.fn().mockImplementation(() => {
        throw new Error('Handler error');
      });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      jamEventBus.subscribe('jam.test-event', faultyHandler);
      jamEventBus.subscribe('jam.test-event', workingHandler);

      const message = JSON.stringify({
        type: 'jam.test-event',
        payload: { data: 'test' }
      });
      
      signalingMessageHandler(message);

      expect(faultyHandler).toHaveBeenCalled();
      expect(workingHandler).toHaveBeenCalledWith({ data: 'test' });
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });
}); 