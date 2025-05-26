import 'reflect-metadata';
import { JoinJamSessionHandler } from '../../../application/handlers/JoinJamSessionHandler';
import { JoinJamSessionCommand } from '../../../application/commands/JoinJamSessionCommand';
import { SessionRepository } from '../../../domain/interfaces/SessionRepository';
import { IJamEventBus } from '../../../domain/interfaces/IJamEventBus';
import { Session, SessionStatus } from '../../../domain/aggregates/Session';
import { SessionId } from '../../../domain/value-objects/SessionId';

describe('JoinJamSessionHandler', () => {
  let handler: JoinJamSessionHandler;
  let mockSessionRepository: jest.Mocked<SessionRepository>;
  let mockEventBus: jest.Mocked<IJamEventBus>;
  let mockSession: Session;
  let sessionId: SessionId;

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

    // Create test session
    sessionId = SessionId.generate();
    mockSession = Session.create(sessionId, 'room-123', 'initiator-player');
    
    // Create handler with mocked dependencies
    handler = new JoinJamSessionHandler(mockSessionRepository, mockEventBus);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handle', () => {
    it('should add player to existing session successfully', async () => {
      // Arrange
      const newPlayerId = 'new-player-456';
      const command = new JoinJamSessionCommand(sessionId.toString(), newPlayerId);

      mockSessionRepository.findById.mockResolvedValue(mockSession);
      mockSessionRepository.save.mockResolvedValue();
      mockEventBus.publish.mockResolvedValue();

      const initialPlayerCount = mockSession.playerCount;

      // Act
      await handler.handle(command);

      // Assert
      expect(mockSession.playerCount).toBe(initialPlayerCount + 1);
      expect(mockSession.playerIds).toContain(newPlayerId);

      // Verify repository interactions
      expect(mockSessionRepository.findById).toHaveBeenCalledWith(expect.any(SessionId));
      expect(mockSessionRepository.save).toHaveBeenCalledWith(mockSession);

      // Verify custom event was published
      expect(mockEventBus.publish).toHaveBeenCalledWith('PlayerJoined', {
        sessionId: sessionId.toString(),
        peerId: newPlayerId
      });
    });

    it('should not add duplicate players', async () => {
      // Arrange
      const existingPlayerId = 'initiator-player'; // Already in session
      const command = new JoinJamSessionCommand(sessionId.toString(), existingPlayerId);

      mockSessionRepository.findById.mockResolvedValue(mockSession);
      mockSessionRepository.save.mockResolvedValue();
      mockEventBus.publish.mockResolvedValue();

      const initialPlayerCount = mockSession.playerCount;

      // Act
      await handler.handle(command);

      // Assert
      expect(mockSession.playerCount).toBe(initialPlayerCount); // No change
      expect(mockSession.playerIds).toContain(existingPlayerId);

      // Repository should still be called
      expect(mockSessionRepository.save).toHaveBeenCalledWith(mockSession);
      
      // Custom event should still be published
      expect(mockEventBus.publish).toHaveBeenCalledWith('PlayerJoined', {
        sessionId: sessionId.toString(),
        peerId: existingPlayerId
      });
    });

    it('should throw error when session not found', async () => {
      // Arrange
      const nonExistentSessionId = SessionId.generate().toString(); // Use valid UUID format
      const command = new JoinJamSessionCommand(nonExistentSessionId, 'player-456');

      mockSessionRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.handle(command)).rejects.toThrow(
        `Session not found with ID: ${nonExistentSessionId}`
      );

      // Verify repository was called but save was not
      expect(mockSessionRepository.findById).toHaveBeenCalledWith(expect.any(SessionId));
      expect(mockSessionRepository.save).not.toHaveBeenCalled();
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });

    it('should throw error when trying to add player to non-pending session', async () => {
      // Arrange
      const newPlayerId = 'new-player-456';
      const command = new JoinJamSessionCommand(sessionId.toString(), newPlayerId);

      // Start the session to change status from pending
      mockSession.setPlayerRole('initiator-player', { 
        id: 'drummer', 
        name: 'Drummer', 
        color: '#FF5722', 
        isUnique: () => true 
      } as any);
      mockSession.setPlayerReady('initiator-player', true);
      mockSession.startJamSession();

      mockSessionRepository.findById.mockResolvedValue(mockSession);

      // Act & Assert
      await expect(handler.handle(command)).rejects.toThrow(
        'Players can only be added when session is pending'
      );

      // Verify repository was called but save was not
      expect(mockSessionRepository.findById).toHaveBeenCalledWith(expect.any(SessionId));
      expect(mockSessionRepository.save).not.toHaveBeenCalled();
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });

    it('should handle repository save failure', async () => {
      // Arrange
      const newPlayerId = 'new-player-456';
      const command = new JoinJamSessionCommand(sessionId.toString(), newPlayerId);
      const saveError = new Error('Database connection failed');

      mockSessionRepository.findById.mockResolvedValue(mockSession);
      mockSessionRepository.save.mockRejectedValue(saveError);
      mockEventBus.publish.mockResolvedValue();

      // Act & Assert
      await expect(handler.handle(command)).rejects.toThrow('Database connection failed');

      // Verify operations were attempted in correct order
      expect(mockSessionRepository.findById).toHaveBeenCalled();
      expect(mockEventBus.publish).toHaveBeenCalled(); // Custom event published before save
      expect(mockSessionRepository.save).toHaveBeenCalled();
    });

    it('should handle custom event publish failure', async () => {
      // Arrange
      const newPlayerId = 'new-player-456';
      const command = new JoinJamSessionCommand(sessionId.toString(), newPlayerId);
      const publishError = new Error('Event bus unavailable');

      mockSessionRepository.findById.mockResolvedValue(mockSession);
      mockEventBus.publish.mockRejectedValue(publishError);

      // Act & Assert
      await expect(handler.handle(command)).rejects.toThrow('Event bus unavailable');

      // Verify repository interactions
      expect(mockSessionRepository.findById).toHaveBeenCalled();
      expect(mockEventBus.publish).toHaveBeenCalled();
      expect(mockSessionRepository.save).not.toHaveBeenCalled(); // Should not reach save
    });

    it('should handle empty peer ID', async () => {
      // Arrange
      const command = new JoinJamSessionCommand(sessionId.toString(), '');

      mockSessionRepository.findById.mockResolvedValue(mockSession);
      mockSessionRepository.save.mockResolvedValue();
      mockEventBus.publish.mockResolvedValue();

      // Act
      await handler.handle(command);

      // Assert
      expect(mockSession.playerIds).toContain('');
      expect(mockEventBus.publish).toHaveBeenCalledWith('PlayerJoined', {
        sessionId: sessionId.toString(),
        peerId: ''
      });
    });

    it('should maintain session state consistency', async () => {
      // Arrange
      const newPlayerId = 'new-player-456';
      const command = new JoinJamSessionCommand(sessionId.toString(), newPlayerId);

      mockSessionRepository.findById.mockResolvedValue(mockSession);
      mockSessionRepository.save.mockResolvedValue();
      mockEventBus.publish.mockResolvedValue();

      const originalStatus = mockSession.status;
      const originalRoomId = mockSession.roomId;

      // Act
      await handler.handle(command);

      // Assert - Other session properties should remain unchanged
      expect(mockSession.status).toBe(originalStatus);
      expect(mockSession.roomId).toBe(originalRoomId);
      expect(mockSession.currentRoundNumber).toBe(0);
      expect(mockSession.currentRoundId).toBeNull();
    });
  });
}); 