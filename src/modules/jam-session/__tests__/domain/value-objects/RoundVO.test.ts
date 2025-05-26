import { RoundVO } from '../../../domain/value-objects/RoundVO';
import { TrackReferenceVO } from '../../../domain/value-objects/TrackReferenceVO';

describe('RoundVO', () => {
  const mockStartTime = new Date('2024-01-01T10:00:00Z');
  const mockDuration = 300; // 5 minutes

  describe('create', () => {
    it('should create a round with valid parameters', () => {
      const round = RoundVO.create(1, mockStartTime, mockDuration);
      
      expect(round).toBeInstanceOf(RoundVO);
      expect(round.roundNumber).toBe(1);
      expect(round.startedAt).toBe(mockStartTime);
      expect(round.durationSeconds).toBe(mockDuration);
      expect(round.endedAt).toBeNull();
      expect(round.tracks).toEqual([]);
      expect(round.isOver()).toBe(false);
    });

    it('should throw error for invalid round number', () => {
      expect(() => RoundVO.create(0, mockStartTime, mockDuration))
        .toThrow('Round number must be positive');
      expect(() => RoundVO.create(-1, mockStartTime, mockDuration))
        .toThrow('Round number must be positive');
    });

    it('should throw error for invalid duration', () => {
      expect(() => RoundVO.create(1, mockStartTime, 0))
        .toThrow('Duration must be positive');
      expect(() => RoundVO.create(1, mockStartTime, -10))
        .toThrow('Duration must be positive');
    });
  });

  describe('end', () => {
    it('should end round with specified end time', () => {
      const round = RoundVO.create(1, mockStartTime, mockDuration);
      const endTime = new Date('2024-01-01T10:05:00Z');
      const endedRound = round.end(endTime);
      
      expect(endedRound).not.toBe(round);
      expect(endedRound.endedAt).toBe(endTime);
      expect(endedRound.isOver()).toBe(true);
      
      // Original should remain unchanged
      expect(round.endedAt).toBeNull();
      expect(round.isOver()).toBe(false);
    });

    it('should end round with current time when no end time provided', () => {
      const round = RoundVO.create(1, mockStartTime, mockDuration);
      const beforeEnd = new Date();
      const endedRound = round.end();
      const afterEnd = new Date();
      
      expect(endedRound.endedAt).not.toBeNull();
      expect(endedRound.endedAt!.getTime()).toBeGreaterThanOrEqual(beforeEnd.getTime());
      expect(endedRound.endedAt!.getTime()).toBeLessThanOrEqual(afterEnd.getTime());
      expect(endedRound.isOver()).toBe(true);
    });

    it('should throw error when ending already ended round', () => {
      const round = RoundVO.create(1, mockStartTime, mockDuration);
      const endedRound = round.end();
      
      expect(() => endedRound.end()).toThrow('Round is already ended');
    });

    it('should throw error when end time is before start time', () => {
      const round = RoundVO.create(1, mockStartTime, mockDuration);
      const invalidEndTime = new Date('2023-12-31T10:00:00Z');
      
      expect(() => round.end(invalidEndTime))
        .toThrow('End time cannot be before start time');
    });
  });

  describe('track reference management', () => {
    it('should add track reference', () => {
      const round = RoundVO.create(1, mockStartTime, mockDuration);
      const updatedRound = round.addTrackReference('track-1', 'player-1');
      
      expect(updatedRound).not.toBe(round);
      expect(updatedRound.tracks).toHaveLength(1);
      expect(updatedRound.tracks[0].trackId).toBe('track-1');
      expect(updatedRound.tracks[0].playerId).toBe('player-1');
      expect(updatedRound.tracks[0].roundNumber).toBe(1);
      
      // Original should remain unchanged
      expect(round.tracks).toHaveLength(0);
    });

    it('should add multiple track references', () => {
      const round = RoundVO.create(1, mockStartTime, mockDuration);
      const updatedRound = round
        .addTrackReference('track-1', 'player-1')
        .addTrackReference('track-2', 'player-2')
        .addTrackReference('track-3', 'player-1');
      
      expect(updatedRound.tracks).toHaveLength(3);
    });

    it('should throw error for empty track ID', () => {
      const round = RoundVO.create(1, mockStartTime, mockDuration);
      
      expect(() => round.addTrackReference('', 'player-1'))
        .toThrow('Track ID and player ID are required');
    });

    it('should throw error for empty player ID', () => {
      const round = RoundVO.create(1, mockStartTime, mockDuration);
      
      expect(() => round.addTrackReference('track-1', ''))
        .toThrow('Track ID and player ID are required');
    });

    it('should get player tracks', () => {
      const round = RoundVO.create(1, mockStartTime, mockDuration)
        .addTrackReference('track-1', 'player-1')
        .addTrackReference('track-2', 'player-2')
        .addTrackReference('track-3', 'player-1');
      
      const player1Tracks = round.getPlayerTracks('player-1');
      expect(player1Tracks).toHaveLength(2);
      expect(player1Tracks[0].trackId).toBe('track-1');
      expect(player1Tracks[1].trackId).toBe('track-3');
      
      const player2Tracks = round.getPlayerTracks('player-2');
      expect(player2Tracks).toHaveLength(1);
      expect(player2Tracks[0].trackId).toBe('track-2');
    });

    it('should throw error when getting tracks for empty player ID', () => {
      const round = RoundVO.create(1, mockStartTime, mockDuration);
      
      expect(() => round.getPlayerTracks(''))
        .toThrow('Player ID is required');
    });
  });

  describe('time calculations', () => {
    it('should calculate remaining seconds correctly', () => {
      const round = RoundVO.create(1, mockStartTime, mockDuration);
      const currentTime = new Date('2024-01-01T10:02:00Z'); // 2 minutes after start
      
      const remainingSeconds = round.getRemainingSeconds(currentTime);
      expect(remainingSeconds).toBe(180); // 3 minutes remaining
    });

    it('should return 0 remaining seconds when time is up', () => {
      const round = RoundVO.create(1, mockStartTime, mockDuration);
      const currentTime = new Date('2024-01-01T10:06:00Z'); // 6 minutes after start
      
      const remainingSeconds = round.getRemainingSeconds(currentTime);
      expect(remainingSeconds).toBe(0);
    });

    it('should return 0 remaining seconds for ended round', () => {
      const round = RoundVO.create(1, mockStartTime, mockDuration);
      const endedRound = round.end();
      const currentTime = new Date('2024-01-01T10:02:00Z');
      
      const remainingSeconds = endedRound.getRemainingSeconds(currentTime);
      expect(remainingSeconds).toBe(0);
    });

    it('should use current time when no time provided', () => {
      const round = RoundVO.create(1, new Date(Date.now() - 60000), 300); // Started 1 minute ago
      
      const remainingSeconds = round.getRemainingSeconds();
      expect(remainingSeconds).toBeGreaterThan(200);
      expect(remainingSeconds).toBeLessThanOrEqual(240);
    });
  });

  describe('equality', () => {
    it('should be equal when round number and start time are the same', () => {
      const round1 = RoundVO.create(1, mockStartTime, mockDuration);
      const round2 = RoundVO.create(1, mockStartTime, 600); // Different duration
      
      expect(round1.equals(round2)).toBe(true);
    });

    it('should not be equal when round numbers are different', () => {
      const round1 = RoundVO.create(1, mockStartTime, mockDuration);
      const round2 = RoundVO.create(2, mockStartTime, mockDuration);
      
      expect(round1.equals(round2)).toBe(false);
    });

    it('should not be equal when start times are different', () => {
      const round1 = RoundVO.create(1, mockStartTime, mockDuration);
      const round2 = RoundVO.create(1, new Date('2024-01-01T11:00:00Z'), mockDuration);
      
      expect(round1.equals(round2)).toBe(false);
    });
  });

  describe('serialization', () => {
    it('should serialize to JSON correctly', () => {
      const round = RoundVO.create(1, mockStartTime, mockDuration)
        .addTrackReference('track-1', 'player-1');
      
      const json = round.toJSON();
      
      expect(json).toEqual({
        roundNumber: 1,
        startedAt: mockStartTime.toISOString(),
        durationSeconds: mockDuration,
        endedAt: null,
        trackReferences: [
          expect.objectContaining({
            trackId: 'track-1',
            playerId: 'player-1',
            roundNumber: 1
          })
        ]
      });
    });

    it('should serialize ended round correctly', () => {
      const endTime = new Date('2024-01-01T10:05:00Z');
      const round = RoundVO.create(1, mockStartTime, mockDuration).end(endTime);
      
      const json = round.toJSON();
      
      expect(json).toEqual({
        roundNumber: 1,
        startedAt: mockStartTime.toISOString(),
        durationSeconds: mockDuration,
        endedAt: endTime.toISOString(),
        trackReferences: []
      });
    });

    it('should have meaningful string representation', () => {
      const round = RoundVO.create(1, mockStartTime, mockDuration);
      expect(round.toString()).toBe('Round 1');
      
      const endedRound = round.end();
      expect(endedRound.toString()).toBe('Round 1 (Ended)');
    });
  });
}); 