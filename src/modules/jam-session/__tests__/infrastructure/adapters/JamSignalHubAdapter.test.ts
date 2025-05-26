import { JamSignalHubAdapter, JamSessionEvents } from '../../../infrastructure/adapters/JamSignalHubAdapter';
import { SignalingService } from '@/modules/collaboration/domain/interfaces/SignalingService';

// Mock SignalingService
const mockSignalingService = {
  on: jest.fn(),
  sendMessage: jest.fn(),
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

describe('JamSignalHubAdapter', () => {
  let adapter: JamSignalHubAdapter;
  let messageHandler: (message: string) => void;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Capture the message handler
    mockSignalingService.on.mockImplementation((event: string, handler: any) => {
      if (event === 'message') {
        messageHandler = handler;
      }
    });
    
    adapter = new JamSignalHubAdapter(mockSignalingService);
  });

  describe('constructor', () => {
    it('should register message handler with signaling service', () => {
      expect(mockSignalingService.on).toHaveBeenCalledWith('message', expect.any(Function));
    });
  });

  describe('setPeerId and peerId getter', () => {
    it('should set and get peer ID correctly', () => {
      const peerId = 'test-peer-123';
      
      adapter.setPeerId(peerId);
      
      expect(adapter.peerId).toBe(peerId);
    });

    it('should initially have null peer ID', () => {
      expect(adapter.peerId).toBeNull();
    });
  });

  describe('send', () => {
    beforeEach(() => {
      adapter.setPeerId('test-peer-123');
      mockSignalingService.sendMessage.mockResolvedValue();
    });

    it('should send message with correct format', async () => {
      const type = JamSessionEvents.SESSION_CREATED;
      const payload = { sessionId: 'session-123', roomId: 'room-456' };

      await adapter.send(type, payload);

      expect(mockSignalingService.sendMessage).toHaveBeenCalledWith(
        expect.stringContaining(type)
      );

      const sentMessage = mockSignalingService.sendMessage.mock.calls[0][0];
      const parsedMessage = JSON.parse(sentMessage);

      expect(parsedMessage.type).toBe(type);
      expect(parsedMessage.payload).toEqual(payload);
      expect(parsedMessage.meta).toHaveProperty('timestamp');
      expect(parsedMessage.meta).toHaveProperty('senderId', 'test-peer-123');
      expect(parsedMessage.meta).toHaveProperty('eventId');
    });

    it('should throw error when peer ID is not set', async () => {
      const adapterWithoutPeerId = new JamSignalHubAdapter(mockSignalingService);

      await expect(adapterWithoutPeerId.send('test-event', {}))
        .rejects.toThrow('Cannot send message: Peer ID not set');
    });

    it('should handle signaling service errors', async () => {
      const error = new Error('Network error');
      mockSignalingService.sendMessage.mockRejectedValue(error);

      await expect(adapter.send('test-event', {}))
        .rejects.toThrow('Failed to send message: Error: Network error');
    });

    it('should include metadata in sent messages', async () => {
      const type = JamSessionEvents.PLAYER_READY;
      const payload = { peerId: 'peer-123', isReady: true };

      await adapter.send(type, payload);

      const sentMessage = mockSignalingService.sendMessage.mock.calls[0][0];
      const parsedMessage = JSON.parse(sentMessage);

      expect(parsedMessage.meta.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(parsedMessage.meta.senderId).toBe('test-peer-123');
      expect(parsedMessage.meta.eventId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });
  });

  describe('event subscription', () => {
    it('should register event handler', () => {
      const handler = jest.fn();
      const eventType = JamSessionEvents.SESSION_STARTED;

      adapter.on(eventType, handler);

      // Simulate incoming message
      const message = JSON.stringify({
        type: eventType,
        payload: { sessionId: 'session-123' }
      });

      messageHandler(message);

      expect(handler).toHaveBeenCalledWith({ sessionId: 'session-123' });
    });

    it('should support multiple handlers for same event', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      const eventType = JamSessionEvents.ROUND_STARTED;
      const payload = { roundNumber: 1 };

      adapter.on(eventType, handler1);
      adapter.on(eventType, handler2);

      const message = JSON.stringify({ type: eventType, payload });
      messageHandler(message);

      expect(handler1).toHaveBeenCalledWith(payload);
      expect(handler2).toHaveBeenCalledWith(payload);
    });

    it('should handle different event types independently', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      adapter.on(JamSessionEvents.SESSION_STARTED, handler1);
      adapter.on(JamSessionEvents.SESSION_ENDED, handler2);

      const message1 = JSON.stringify({
        type: JamSessionEvents.SESSION_STARTED,
        payload: { sessionId: 'session-123' }
      });

      const message2 = JSON.stringify({
        type: JamSessionEvents.SESSION_ENDED,
        payload: { sessionId: 'session-456' }
      });

      messageHandler(message1);
      messageHandler(message2);

      expect(handler1).toHaveBeenCalledWith({ sessionId: 'session-123' });
      expect(handler2).toHaveBeenCalledWith({ sessionId: 'session-456' });
    });
  });

  describe('event unsubscription', () => {
    it('should remove specific handler', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      const eventType = JamSessionEvents.PLAYER_ROLE_SET;

      adapter.on(eventType, handler1);
      adapter.on(eventType, handler2);
      adapter.off(eventType, handler1);

      const message = JSON.stringify({
        type: eventType,
        payload: { peerId: 'peer-123', role: 'drummer' }
      });

      messageHandler(message);

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledWith({ peerId: 'peer-123', role: 'drummer' });
    });

    it('should handle removing non-existent handler gracefully', () => {
      const handler = jest.fn();

      expect(() => {
        adapter.off('non-existent-event', handler);
      }).not.toThrow();
    });

    it('should clean up empty handler sets', () => {
      const handler = jest.fn();
      const eventType = JamSessionEvents.COUNTDOWN_TICK;

      adapter.on(eventType, handler);
      adapter.off(eventType, handler);

      // Should not call handler after removal
      const message = JSON.stringify({
        type: eventType,
        payload: { remainingSeconds: 30 }
      });

      messageHandler(message);

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('message handling', () => {
    it('should parse and handle valid JSON messages', () => {
      const handler = jest.fn();
      const eventType = 'test-event';
      const payload = { data: 'test' };

      adapter.on(eventType, handler);

      const message = JSON.stringify({ type: eventType, payload });
      messageHandler(message);

      expect(handler).toHaveBeenCalledWith(payload);
    });

    it('should handle invalid JSON messages gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const invalidMessage = 'invalid json {';
      
      expect(() => {
        messageHandler(invalidMessage);
      }).not.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error processing message in JamSignalHubAdapter:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should validate message format', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const handler = jest.fn();

      adapter.on('test-event', handler);

      // Invalid message without type
      const invalidMessage1 = JSON.stringify({ payload: { data: 'test' } });
      messageHandler(invalidMessage1);

      // Invalid message without payload
      const invalidMessage2 = JSON.stringify({ type: 'test-event' });
      messageHandler(invalidMessage2);

      expect(consoleSpy).toHaveBeenCalledTimes(2);
      expect(handler).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle handler errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const faultyHandler = jest.fn().mockImplementation(() => {
        throw new Error('Handler error');
      });
      const workingHandler = jest.fn();

      adapter.on('test-event', faultyHandler);
      adapter.on('test-event', workingHandler);

      const message = JSON.stringify({
        type: 'test-event',
        payload: { data: 'test' }
      });

      messageHandler(message);

      expect(faultyHandler).toHaveBeenCalled();
      expect(workingHandler).toHaveBeenCalledWith({ data: 'test' });
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error in handler for event test-event:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('JamSessionEvents constants', () => {
    it('should have all required event types', () => {
      expect(JamSessionEvents.SESSION_CREATED).toBe('jam.session-created');
      expect(JamSessionEvents.PLAYER_ROLE_SET).toBe('jam.player-role-set');
      expect(JamSessionEvents.PLAYER_READY).toBe('jam.player-ready');
      expect(JamSessionEvents.SESSION_STARTED).toBe('jam.session-started');
      expect(JamSessionEvents.ROUND_STARTED).toBe('jam.round-started');
      expect(JamSessionEvents.ROUND_ENDED).toBe('jam.round-ended');
      expect(JamSessionEvents.SESSION_ENDED).toBe('jam.session-ended');
      expect(JamSessionEvents.PLAYER_LEFT).toBe('jam.player-left-session');
      expect(JamSessionEvents.COUNTDOWN_TICK).toBe('jam.countdown-tick');
    });
  });
}); 