import 'reflect-metadata';
import { SetPlayerRoleHandler } from '../../../application/handlers/SetPlayerRoleHandler';
import { SetPlayerRoleCommand } from '../../../application/commands/SetPlayerRoleCommand';
import { SessionRepository } from '../../../domain/interfaces/SessionRepository';
import { IJamEventBus } from '../../../domain/interfaces/IJamEventBus';
import { RoleRegistry } from '../../../application/services/RoleRegistry';
import { Session } from '../../../domain/aggregates/Session';
import { SessionId } from '../../../domain/value-objects/SessionId';
import { RoleVO } from '../../../domain/value-objects/RoleVO';

describe('SetPlayerRoleHandler', () => {
  let handler: SetPlayerRoleHandler;
  let mockSessionRepository: jest.Mocked<SessionRepository>;
  let mockEventBus: jest.Mocked<IJamEventBus>;
  let mockRoleRegistry: jest.Mocked<RoleRegistry>;
  let mockSession: Session;
  let sessionId: SessionId;
  let testRole: RoleVO;

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

    mockRoleRegistry = {
      getAllRoles: jest.fn(),
      getRoleById: jest.fn(),
      isValidRoleId: jest.fn(),
      getUniqueRoles: jest.fn(),
      getNonUniqueRoles: jest.fn(),
    } as unknown as jest.Mocked<RoleRegistry>;

    // Create test data
    sessionId = SessionId.generate();
    mockSession = Session.create(sessionId, 'room-123', 'initiator-player');
    mockSession.addPlayer('test-player');
    
    testRole = RoleVO.create('drummer', 'Drummer', '#FF5722', true);
    
    // Create handler with mocked dependencies
    handler = new SetPlayerRoleHandler(mockSessionRepository, mockEventBus, mockRoleRegistry);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handle', () => {
    it('should set player role successfully', async () => {
      // Arrange
      const command = new SetPlayerRoleCommand(
        sessionId.toString(),
        'test-player',
        'drummer',
        'Drummer',
        '#FF5722'
      );

      mockSessionRepository.findById.mockResolvedValue(mockSession);
      mockSessionRepository.save.mockResolvedValue();
      mockEventBus.publish.mockResolvedValue();
      mockRoleRegistry.isValidRoleId.mockReturnValue(true);
      mockRoleRegistry.getRoleById.mockReturnValue(testRole);

      // Act
      await handler.handle(command);

      // Assert
      expect(mockSession.players.get('test-player')?.role).toEqual(testRole);

      // Verify repository interactions
      expect(mockSessionRepository.findById).toHaveBeenCalledWith(expect.any(SessionId));
      expect(mockSessionRepository.save).toHaveBeenCalledWith(mockSession);

      // Verify role registry interactions
      expect(mockRoleRegistry.isValidRoleId).toHaveBeenCalledWith('drummer');
      expect(mockRoleRegistry.getRoleById).toHaveBeenCalledWith('drummer');
    });

    it('should throw error for invalid role ID', async () => {
      // Arrange
      const command = new SetPlayerRoleCommand(
        sessionId.toString(),
        'test-player',
        'invalid-role',
        'Invalid Role',
        '#000000'
      );

      mockSessionRepository.findById.mockResolvedValue(mockSession);
      mockRoleRegistry.isValidRoleId.mockReturnValue(false);

      // Act & Assert
      await expect(handler.handle(command)).rejects.toThrow(
        'Invalid role ID: invalid-role'
      );

      // Verify role registry was called but session was not saved
      expect(mockRoleRegistry.isValidRoleId).toHaveBeenCalledWith('invalid-role');
      expect(mockRoleRegistry.getRoleById).not.toHaveBeenCalled();
      expect(mockSessionRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error when role not found', async () => {
      // Arrange
      const command = new SetPlayerRoleCommand(
        sessionId.toString(),
        'test-player',
        'drummer',
        'Drummer',
        '#FF5722'
      );

      mockSessionRepository.findById.mockResolvedValue(mockSession);
      mockRoleRegistry.isValidRoleId.mockReturnValue(true);
      mockRoleRegistry.getRoleById.mockReturnValue(undefined);

      // Act & Assert
      await expect(handler.handle(command)).rejects.toThrow(
        'Role not found with ID: drummer'
      );

      // Verify role registry interactions
      expect(mockRoleRegistry.isValidRoleId).toHaveBeenCalledWith('drummer');
      expect(mockRoleRegistry.getRoleById).toHaveBeenCalledWith('drummer');
      expect(mockSessionRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error when session not found', async () => {
      // Arrange
      const nonExistentSessionId = SessionId.generate().toString();
      const command = new SetPlayerRoleCommand(
        nonExistentSessionId,
        'test-player',
        'drummer',
        'Drummer',
        '#FF5722'
      );

      mockSessionRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.handle(command)).rejects.toThrow(
        `Session not found with ID: ${nonExistentSessionId}`
      );

      // Verify repository was called but role registry was not
      expect(mockSessionRepository.findById).toHaveBeenCalledWith(expect.any(SessionId));
      expect(mockRoleRegistry.isValidRoleId).not.toHaveBeenCalled();
      expect(mockSessionRepository.save).not.toHaveBeenCalled();
    });

    it('should handle repository save failure', async () => {
      // Arrange
      const command = new SetPlayerRoleCommand(
        sessionId.toString(),
        'test-player',
        'drummer',
        'Drummer',
        '#FF5722'
      );
      const saveError = new Error('Database connection failed');

      mockSessionRepository.findById.mockResolvedValue(mockSession);
      mockSessionRepository.save.mockRejectedValue(saveError);
      mockEventBus.publish.mockResolvedValue();
      mockRoleRegistry.isValidRoleId.mockReturnValue(true);
      mockRoleRegistry.getRoleById.mockReturnValue(testRole);

      // Act & Assert
      await expect(handler.handle(command)).rejects.toThrow('Database connection failed');

      // Verify operations were attempted in correct order
      expect(mockRoleRegistry.isValidRoleId).toHaveBeenCalled();
      expect(mockRoleRegistry.getRoleById).toHaveBeenCalled();
      expect(mockSessionRepository.save).toHaveBeenCalled();
    });

    it('should handle player not in session', async () => {
      // Arrange
      const command = new SetPlayerRoleCommand(
        sessionId.toString(),
        'non-existent-player',
        'drummer',
        'Drummer',
        '#FF5722'
      );

      mockSessionRepository.findById.mockResolvedValue(mockSession);
      mockRoleRegistry.isValidRoleId.mockReturnValue(true);
      mockRoleRegistry.getRoleById.mockReturnValue(testRole);

      // Act & Assert
      await expect(handler.handle(command)).rejects.toThrow(
        'Player not found in session'
      );

      // Verify role registry was called
      expect(mockRoleRegistry.isValidRoleId).toHaveBeenCalledWith('drummer');
      expect(mockRoleRegistry.getRoleById).toHaveBeenCalledWith('drummer');
      expect(mockSessionRepository.save).not.toHaveBeenCalled();
    });

    it('should maintain session state consistency', async () => {
      // Arrange
      const command = new SetPlayerRoleCommand(
        sessionId.toString(),
        'test-player',
        'drummer',
        'Drummer',
        '#FF5722'
      );

      mockSessionRepository.findById.mockResolvedValue(mockSession);
      mockSessionRepository.save.mockResolvedValue();
      mockEventBus.publish.mockResolvedValue();
      mockRoleRegistry.isValidRoleId.mockReturnValue(true);
      mockRoleRegistry.getRoleById.mockReturnValue(testRole);

      const originalStatus = mockSession.status;
      const originalRoomId = mockSession.roomId;
      const originalPlayerCount = mockSession.playerCount;

      // Act
      await handler.handle(command);

      // Assert - Other session properties should remain unchanged
      expect(mockSession.status).toBe(originalStatus);
      expect(mockSession.roomId).toBe(originalRoomId);
      expect(mockSession.playerCount).toBe(originalPlayerCount);
    });
  });
}); 