import 'reflect-metadata';
import { CreateJamSessionHandler } from '../../../application/handlers/CreateJamSessionHandler';
import { CreateJamSessionCommand } from '../../../application/commands/CreateJamSessionCommand';
import { SessionRepository } from '../../../domain/interfaces/SessionRepository';
import { IJamEventBus } from '../../../domain/interfaces/IJamEventBus';
import { Session } from '../../../domain/aggregates/Session';
import { SessionId } from '../../../domain/value-objects/SessionId';
import { JamEventTypes } from '../../../domain/events/EventTypes';

describe('CreateJamSessionHandler', () => {
  let handler: CreateJamSessionHandler;
  let mockSessionRepository: jest.Mocked<SessionRepository>;
  let mockEventBus: jest.Mocked<IJamEventBus>;

  beforeEach(() => {
    // Create mock dependencies
    mockSessionRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findByRoomId: jest.fn(),
      findCurrentSessionInRoom: jest.fn(),
      findByPlayerId: jest.fn(),
    };

    mockEventBus = {
      publish: jest.fn(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    };

    // Create handler with mocked dependencies
    handler = new CreateJamSessionHandler(mockSessionRepository, mockEventBus);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handle', () => {
    it('should create and save a new session successfully', async () => {
      // Arrange
      const roomId = 'room-123';
      const initiatorPeerId = 'player-456';
      const command = new CreateJamSessionCommand(roomId, initiatorPeerId);

      mockSessionRepository.save.mockResolvedValue();
      mockEventBus.publish.mockResolvedValue();

      // Act
      const result = await handler.handle(command);

      // Assert
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(SessionId.fromString(result)).toBeInstanceOf(SessionId);

      // Verify session was saved
      expect(mockSessionRepository.save).toHaveBeenCalledTimes(1);
      const savedSession = mockSessionRepository.save.mock.calls[0][0];
      expect(savedSession).toBeInstanceOf(Session);
      expect(savedSession.roomId).toBe(roomId);
      expect(savedSession.playerIds).toContain(initiatorPeerId);

      // Verify event was published
      expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        JamEventTypes.SESSION_CREATED,
        {
          sessionId: result,
          roomId: roomId,
          initiatorPeerId: initiatorPeerId
        }
      );
    });

    it('should generate unique session IDs for different commands', async () => {
      // Arrange
      const command1 = new CreateJamSessionCommand('room-1', 'player-1');
      const command2 = new CreateJamSessionCommand('room-2', 'player-2');

      mockSessionRepository.save.mockResolvedValue();
      mockEventBus.publish.mockResolvedValue();

      // Act
      const result1 = await handler.handle(command1);
      const result2 = await handler.handle(command2);

      // Assert
      expect(result1).not.toBe(result2);
      expect(SessionId.fromString(result1)).not.toEqual(SessionId.fromString(result2));
    });

    it('should handle repository save failure', async () => {
      // Arrange
      const command = new CreateJamSessionCommand('room-123', 'player-456');
      const saveError = new Error('Database connection failed');

      mockSessionRepository.save.mockRejectedValue(saveError);

      // Act & Assert
      await expect(handler.handle(command)).rejects.toThrow('Database connection failed');

      // Verify save was attempted
      expect(mockSessionRepository.save).toHaveBeenCalledTimes(1);
      
      // Event should not be published if save fails
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });

    it('should handle event bus publish failure', async () => {
      // Arrange
      const command = new CreateJamSessionCommand('room-123', 'player-456');
      const publishError = new Error('Event bus unavailable');

      mockSessionRepository.save.mockResolvedValue();
      mockEventBus.publish.mockRejectedValue(publishError);

      // Act & Assert
      await expect(handler.handle(command)).rejects.toThrow('Event bus unavailable');

      // Verify session was saved before event publishing failed
      expect(mockSessionRepository.save).toHaveBeenCalledTimes(1);
      expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
    });

    it('should create session with correct initial state', async () => {
      // Arrange
      const roomId = 'room-123';
      const initiatorPeerId = 'player-456';
      const command = new CreateJamSessionCommand(roomId, initiatorPeerId);

      mockSessionRepository.save.mockResolvedValue();
      mockEventBus.publish.mockResolvedValue();

      // Act
      await handler.handle(command);

      // Assert
      const savedSession = mockSessionRepository.save.mock.calls[0][0] as Session;
      expect(savedSession.status).toBe('pending');
      expect(savedSession.playerCount).toBe(1);
      expect(savedSession.currentRoundNumber).toBe(0);
      expect(savedSession.currentRoundId).toBeNull();
    });

    it('should handle empty room ID and peer ID', async () => {
      // Arrange
      const command = new CreateJamSessionCommand('', '');

      mockSessionRepository.save.mockResolvedValue();
      mockEventBus.publish.mockResolvedValue();

      // Act
      const result = await handler.handle(command);

      // Assert
      expect(result).toBeDefined();
      
      const savedSession = mockSessionRepository.save.mock.calls[0][0] as Session;
      expect(savedSession.roomId).toBe('');
      expect(savedSession.playerIds).toContain('');
    });

    it('should publish event with correct event type', async () => {
      // Arrange
      const command = new CreateJamSessionCommand('room-123', 'player-456');

      mockSessionRepository.save.mockResolvedValue();
      mockEventBus.publish.mockResolvedValue();

      // Act
      await handler.handle(command);

      // Assert
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        JamEventTypes.SESSION_CREATED,
        expect.any(Object)
      );
    });
  });
}); 