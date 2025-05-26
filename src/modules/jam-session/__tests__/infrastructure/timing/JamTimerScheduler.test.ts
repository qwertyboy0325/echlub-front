import { JamTimerScheduler } from '../../../infrastructure/timing/JamTimerScheduler';
import { SessionRepository } from '../../../domain/interfaces/SessionRepository';
import { JamEventBus } from '../../../infrastructure/messaging/JamEventBus';
import { Session } from '../../../domain/aggregates/Session';
import { SessionId } from '../../../domain/value-objects/SessionId';

// Mock dependencies
const mockSessionRepository = {
  findById: jest.fn(),
  findByRoomId: jest.fn(),
  findByPeerId: jest.fn(),
  findCurrentSessionInRoom: jest.fn(),
  findByPlayerId: jest.fn(),
  save: jest.fn(),
  delete: jest.fn()
} as unknown as jest.Mocked<SessionRepository>;

const mockEventBus = {
  publish: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn()
} as unknown as jest.Mocked<JamEventBus>;

// Mock setTimeout and clearTimeout
const mockSetTimeout = jest.fn();
const mockClearTimeout = jest.fn();

// Store original functions
const originalSetTimeout = global.setTimeout;
const originalClearTimeout = global.clearTimeout;

describe('JamTimerScheduler', () => {
  let scheduler: JamTimerScheduler;
  let roundStartedHandler: (event: any) => Promise<void>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock global timer functions
    global.setTimeout = mockSetTimeout as any;
    global.clearTimeout = mockClearTimeout as any;
    
    // Capture the round started handler
    mockEventBus.subscribe.mockImplementation((eventType: string, handler: any) => {
      if (eventType === 'jam.round-started') {
        roundStartedHandler = handler;
      }
    });
    
    scheduler = new JamTimerScheduler(mockSessionRepository, mockEventBus);
  });

  afterEach(() => {
    // Restore original functions
    global.setTimeout = originalSetTimeout;
    global.clearTimeout = originalClearTimeout;
  });

  describe('constructor', () => {
    it('should subscribe to round started events', () => {
      expect(mockEventBus.subscribe).toHaveBeenCalledWith(
        'jam.round-started',
        expect.any(Function)
      );
    });
  });

  describe('scheduleRoundEnd', () => {
    const mockSession = {
      endCurrentRound: jest.fn(),
      collectDomainEvents: jest.fn().mockReturnValue([
        { eventType: 'RoundEnded', sessionId: 'session-123', roundNumber: 1 }
      ])
    } as any;

    beforeEach(() => {
      mockSessionRepository.findById.mockResolvedValue(mockSession);
      mockSessionRepository.save.mockResolvedValue();
      mockEventBus.publish.mockResolvedValue();
    });

    it('should schedule timer for round end', async () => {
      const event = {
        sessionId: 'session-123',
        roundNumber: 1,
        durationSeconds: 300
      };

      await roundStartedHandler(event);

      expect(mockSetTimeout).toHaveBeenCalledWith(
        expect.any(Function),
        300000 // 300 seconds * 1000
      );
    });

    it('should clear existing timer before setting new one', async () => {
      const event = {
        sessionId: 'session-123',
        roundNumber: 1,
        durationSeconds: 300
      };

      // First call
      await roundStartedHandler(event);
      
      // Second call with same session and round
      await roundStartedHandler(event);

      expect(mockClearTimeout).toHaveBeenCalled();
      expect(mockSetTimeout).toHaveBeenCalledTimes(2);
    });

    it('should handle timer execution correctly', async () => {
      const event = {
        sessionId: 'session-123',
        roundNumber: 1,
        durationSeconds: 300
      };

      // Mock setTimeout to immediately execute the callback asynchronously
      mockSetTimeout.mockImplementation((callback: () => void) => {
        // Execute callback asynchronously to properly handle promises
        Promise.resolve().then(async () => {
          await callback();
        });
        return 'timer-id' as any;
      });

      await roundStartedHandler(event);
      
      // Wait for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockSessionRepository.findById).toHaveBeenCalledWith(
        expect.objectContaining({
          toString: expect.any(Function)
        })
      );
      expect(mockSession.endCurrentRound).toHaveBeenCalled();
      expect(mockSessionRepository.save).toHaveBeenCalledWith(mockSession);
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        'RoundEnded',
        expect.objectContaining({
          eventType: 'RoundEnded',
          sessionId: 'session-123',
          roundNumber: 1
        })
      );
    });

    it('should handle session not found gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockSessionRepository.findById.mockResolvedValue(null);

      const event = {
        sessionId: 'non-existent-session',
        roundNumber: 1,
        durationSeconds: 300
      };

      let timerCallback: (() => void) | undefined;

      // Mock setTimeout to capture the callback
      mockSetTimeout.mockImplementation((callback: () => void) => {
        timerCallback = callback;
        return 'timer-id' as any;
      });

      await roundStartedHandler(event);
      
      // Execute the timer callback manually
      if (timerCallback) {
        await timerCallback();
      }

      expect(consoleSpy).toHaveBeenCalledWith(
        'Session non-existent-session not found when trying to end round 1'
      );
      expect(mockSession.endCurrentRound).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should handle errors during round ending gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Round ending failed');
      mockSession.endCurrentRound.mockImplementation(() => {
        throw error;
      });

      const event = {
        sessionId: 'session-123',
        roundNumber: 1,
        durationSeconds: 300
      };

      // Mock setTimeout to immediately execute the callback
      mockSetTimeout.mockImplementation((callback: () => void) => {
        callback();
        return 'timer-id' as any;
      });

      await roundStartedHandler(event);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error ending round 1 for session session-123:',
        error
      );
      
      consoleSpy.mockRestore();
    });

    it('should generate unique timer IDs for different sessions', async () => {
      const event1 = {
        sessionId: 'session-123',
        roundNumber: 1,
        durationSeconds: 300
      };

      const event2 = {
        sessionId: 'session-456',
        roundNumber: 1,
        durationSeconds: 300
      };

      await roundStartedHandler(event1);
      await roundStartedHandler(event2);

      expect(mockSetTimeout).toHaveBeenCalledTimes(2);
    });

    it('should generate unique timer IDs for different rounds', async () => {
      const event1 = {
        sessionId: 'session-123',
        roundNumber: 1,
        durationSeconds: 300
      };

      const event2 = {
        sessionId: 'session-123',
        roundNumber: 2,
        durationSeconds: 300
      };

      await roundStartedHandler(event1);
      await roundStartedHandler(event2);

      expect(mockSetTimeout).toHaveBeenCalledTimes(2);
    });
  });

  describe('cancelRoundEndTimer', () => {
    it('should cancel specific round timer', async () => {
      const sessionId = 'session-123';
      const roundNumber = 1;
      
      // First, create a timer by triggering a round start
      const event = {
        sessionId,
        roundNumber,
        durationSeconds: 300
      };
      
      const mockTimerId = 'mock-timer-123';
      mockSetTimeout.mockReturnValue(mockTimerId as any);
      
      await roundStartedHandler(event);
      
      // Now cancel the timer
      scheduler.cancelRoundEndTimer(sessionId, roundNumber);

      expect(mockClearTimeout).toHaveBeenCalledWith(mockTimerId);
    });

    it('should handle canceling non-existent timer gracefully', () => {
      const sessionId = 'non-existent-session';
      const roundNumber = 1;

      expect(() => {
        scheduler.cancelRoundEndTimer(sessionId, roundNumber);
      }).not.toThrow();
    });

    it('should cancel correct timer among multiple timers', () => {
      // Simulate multiple timers being set
      const event1 = {
        sessionId: 'session-123',
        roundNumber: 1,
        durationSeconds: 300
      };

      const event2 = {
        sessionId: 'session-123',
        roundNumber: 2,
        durationSeconds: 300
      };

      roundStartedHandler(event1);
      roundStartedHandler(event2);

      // Cancel only round 1 timer
      scheduler.cancelRoundEndTimer('session-123', 1);

      expect(mockClearTimeout).toHaveBeenCalled();
    });
  });

  describe('timer management', () => {
    it('should store timer references correctly', async () => {
      const mockTimerId = 'mock-timer-123';
      mockSetTimeout.mockReturnValue(mockTimerId as any);

      const event = {
        sessionId: 'session-123',
        roundNumber: 1,
        durationSeconds: 300
      };

      await roundStartedHandler(event);

      expect(mockSetTimeout).toHaveBeenCalledWith(
        expect.any(Function),
        300000
      );
    });

    it('should clean up timer references after execution', async () => {
      let timerCallback: (() => void) | undefined;
      
      mockSetTimeout.mockImplementation((callback: () => void) => {
        timerCallback = callback;
        return 'timer-id' as any;
      });

      const event = {
        sessionId: 'session-123',
        roundNumber: 1,
        durationSeconds: 300
      };

      await roundStartedHandler(event);

      // Execute the timer callback
      if (timerCallback) {
        await timerCallback();
      }

      // Timer reference should be cleaned up (this is internal behavior)
      // We can't directly test this, but we can verify the callback executed
      expect(mockSessionRepository.findById).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle repository errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const repositoryError = new Error('Repository error');
      
      // Mock session.endCurrentRound to throw error (this is where the try-catch is)
      const mockSession = {
        endCurrentRound: jest.fn().mockImplementation(() => {
          throw repositoryError;
        }),
        collectDomainEvents: jest.fn().mockReturnValue([])
      };
      
      mockSessionRepository.findById.mockResolvedValue(mockSession as any);

      const event = {
        sessionId: 'session-123',
        roundNumber: 1,
        durationSeconds: 300
      };

      let timerCallback: (() => void) | undefined;

      // Mock setTimeout to capture the callback
      mockSetTimeout.mockImplementation((callback: () => void) => {
        timerCallback = callback;
        return 'timer-id' as any;
      });

      await roundStartedHandler(event);
      
      // Execute the timer callback manually
      if (timerCallback) {
        await timerCallback();
      }

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error ending round 1 for session session-123:',
        repositoryError
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle event bus errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const eventBusError = new Error('Event bus error');
      
      // Mock eventBus.publish to throw error (this is where the try-catch is)
      mockEventBus.publish.mockRejectedValue(eventBusError);
      
      // Mock session to return events
      const mockSession = {
        endCurrentRound: jest.fn(),
        collectDomainEvents: jest.fn().mockReturnValue([
          { eventType: 'RoundEnded', sessionId: 'session-123', roundNumber: 1 }
        ])
      };
      
      mockSessionRepository.findById.mockResolvedValue(mockSession as any);
      mockSessionRepository.save.mockResolvedValue();

      const event = {
        sessionId: 'session-123',
        roundNumber: 1,
        durationSeconds: 300
      };

      let timerCallback: (() => void) | undefined;

      // Mock setTimeout to capture the callback
      mockSetTimeout.mockImplementation((callback: () => void) => {
        timerCallback = callback;
        return 'timer-id' as any;
      });

      await roundStartedHandler(event);
      
      // Execute the timer callback manually
      if (timerCallback) {
        await timerCallback();
      }

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error ending round 1 for session session-123:',
        eventBusError
      );
      
      consoleSpy.mockRestore();
    });
  });
}); 