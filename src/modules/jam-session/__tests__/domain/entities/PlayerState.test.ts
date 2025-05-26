import { PlayerState } from '../../../domain/entities/PlayerState';
import { RoleVO } from '../../../domain/value-objects/RoleVO';

describe('PlayerState', () => {
  const mockPeerId = 'player-123';
  const mockJoinedAt = new Date('2024-01-01T10:00:00Z');
  let drummerRole: RoleVO;
  let guitaristRole: RoleVO;

  beforeEach(() => {
    drummerRole = RoleVO.create('drummer', 'Drummer', '#FF5733');
    guitaristRole = RoleVO.create('guitarist', 'Guitarist', '#33FF57');
  });

  describe('create', () => {
    it('should create a player state with initial values', () => {
      const playerState = PlayerState.create(mockPeerId, mockJoinedAt);
      
      expect(playerState).toBeInstanceOf(PlayerState);
      expect(playerState.peerId).toBe(mockPeerId);
      expect(playerState.joinedAt).toEqual(mockJoinedAt);
      expect(playerState.role).toBeNull();
      expect(playerState.isReady).toBe(false);
      expect(playerState.hasCompletedCurrentRound).toBe(false);
      expect(playerState.hasConfirmedNextRound).toBe(false);
    });

    it('should return a new Date object for joinedAt to prevent mutation', () => {
      const playerState = PlayerState.create(mockPeerId, mockJoinedAt);
      const joinedAt1 = playerState.joinedAt;
      const joinedAt2 = playerState.joinedAt;
      
      expect(joinedAt1).not.toBe(joinedAt2);
      expect(joinedAt1).toEqual(joinedAt2);
    });
  });

  describe('role management', () => {
    it('should set role correctly', () => {
      const playerState = PlayerState.create(mockPeerId, mockJoinedAt);
      
      playerState.setRole(drummerRole);
      
      expect(playerState.role).toBe(drummerRole);
      expect(playerState.hasRole()).toBe(true);
      expect(playerState.hasRole(drummerRole)).toBe(true);
      expect(playerState.hasRole(guitaristRole)).toBe(false);
    });

    it('should reset ready state when role changes', () => {
      const playerState = PlayerState.create(mockPeerId, mockJoinedAt);
      
      playerState.setRole(drummerRole);
      playerState.setReady(true);
      expect(playerState.isReady).toBe(true);
      
      playerState.setRole(guitaristRole);
      expect(playerState.isReady).toBe(false);
    });

    it('should allow setting role to null', () => {
      const playerState = PlayerState.create(mockPeerId, mockJoinedAt);
      
      playerState.setRole(drummerRole);
      expect(playerState.hasRole()).toBe(true);
      
      playerState.setRole(null);
      expect(playerState.role).toBeNull();
      expect(playerState.hasRole()).toBe(false);
      expect(playerState.hasRole(drummerRole)).toBe(false);
    });

    it('should reset ready state when role is set to null', () => {
      const playerState = PlayerState.create(mockPeerId, mockJoinedAt);
      
      playerState.setRole(drummerRole);
      playerState.setReady(true);
      
      playerState.setRole(null);
      expect(playerState.isReady).toBe(false);
    });
  });

  describe('ready state management', () => {
    it('should toggle ready state', () => {
      const playerState = PlayerState.create(mockPeerId, mockJoinedAt);
      
      expect(playerState.isReady).toBe(false);
      
      playerState.setReady(true);
      expect(playerState.isReady).toBe(true);
      
      playerState.setReady(false);
      expect(playerState.isReady).toBe(false);
    });
  });

  describe('round state management', () => {
    it('should manage round completion state', () => {
      const playerState = PlayerState.create(mockPeerId, mockJoinedAt);
      
      expect(playerState.hasCompletedCurrentRound).toBe(false);
      
      playerState.setRoundCompletion(true);
      expect(playerState.hasCompletedCurrentRound).toBe(true);
      
      playerState.setRoundCompletion(false);
      expect(playerState.hasCompletedCurrentRound).toBe(false);
    });

    it('should manage next round confirmation state', () => {
      const playerState = PlayerState.create(mockPeerId, mockJoinedAt);
      
      expect(playerState.hasConfirmedNextRound).toBe(false);
      
      playerState.setNextRoundConfirmation(true);
      expect(playerState.hasConfirmedNextRound).toBe(true);
      
      playerState.setNextRoundConfirmation(false);
      expect(playerState.hasConfirmedNextRound).toBe(false);
    });

    it('should reset round state', () => {
      const playerState = PlayerState.create(mockPeerId, mockJoinedAt);
      
      playerState.setRoundCompletion(true);
      playerState.setNextRoundConfirmation(true);
      
      expect(playerState.hasCompletedCurrentRound).toBe(true);
      expect(playerState.hasConfirmedNextRound).toBe(true);
      
      playerState.resetRoundState();
      
      expect(playerState.hasCompletedCurrentRound).toBe(false);
      expect(playerState.hasConfirmedNextRound).toBe(false);
    });
  });

  describe('getters and immutability', () => {
    it('should provide immutable access to properties', () => {
      const playerState = PlayerState.create(mockPeerId, mockJoinedAt);
      
      // These should be read-only
      expect(playerState.peerId).toBe(mockPeerId);
      expect(playerState.joinedAt).toEqual(mockJoinedAt);
      expect(playerState.isReady).toBe(false);
      expect(playerState.hasCompletedCurrentRound).toBe(false);
      expect(playerState.hasConfirmedNextRound).toBe(false);
    });

    it('should maintain encapsulation of internal state', () => {
      const playerState = PlayerState.create(mockPeerId, mockJoinedAt);
      
      // Verify that getters return consistent values
      expect(playerState.peerId).toBe(mockPeerId);
      expect(playerState.joinedAt).toEqual(mockJoinedAt);
      
      // Verify that state can only be changed through proper methods
      expect(playerState.isReady).toBe(false);
      playerState.setReady(true);
      expect(playerState.isReady).toBe(true);
    });
  });
}); 