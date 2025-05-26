import { TrackReferenceVO } from '../../../domain/value-objects/TrackReferenceVO';

describe('TrackReferenceVO', () => {
  describe('create', () => {
    it('should create TrackReferenceVO with valid properties', () => {
      const trackId = 'track-123';
      const playerId = 'player-456';
      const roundNumber = 1;
      const createdAt = new Date('2023-01-01T00:00:00Z');
      
      const trackRef = TrackReferenceVO.create(trackId, playerId, roundNumber, createdAt);

      expect(trackRef.trackId).toBe(trackId);
      expect(trackRef.playerId).toBe(playerId);
      expect(trackRef.roundNumber).toBe(roundNumber);
      expect(trackRef.createdAt).toBe(createdAt);
    });

    it('should create with default createdAt when not provided', () => {
      const trackRef = TrackReferenceVO.create('track-123', 'player-456', 1);

      expect(trackRef.trackId).toBe('track-123');
      expect(trackRef.playerId).toBe('player-456');
      expect(trackRef.roundNumber).toBe(1);
      expect(trackRef.createdAt).toBeInstanceOf(Date);
    });

    it('should throw error for empty trackId', () => {
      expect(() => {
        TrackReferenceVO.create('', 'player-456', 1);
      }).toThrow('Track ID and player ID are required');
    });

    it('should throw error for empty playerId', () => {
      expect(() => {
        TrackReferenceVO.create('track-123', '', 1);
      }).toThrow('Track ID and player ID are required');
    });

    it('should throw error for invalid round number', () => {
      expect(() => {
        TrackReferenceVO.create('track-123', 'player-456', 0);
      }).toThrow('Round number must be positive');

      expect(() => {
        TrackReferenceVO.create('track-123', 'player-456', -1);
      }).toThrow('Round number must be positive');
    });
  });

  describe('equals', () => {
    it('should return true for same properties', () => {
      const trackRef1 = TrackReferenceVO.create('track-123', 'player-456', 1);
      const trackRef2 = TrackReferenceVO.create('track-123', 'player-456', 1);

      expect(trackRef1.equals(trackRef2)).toBe(true);
    });

    it('should return false for different trackId', () => {
      const trackRef1 = TrackReferenceVO.create('track-123', 'player-456', 1);
      const trackRef2 = TrackReferenceVO.create('track-789', 'player-456', 1);

      expect(trackRef1.equals(trackRef2)).toBe(false);
    });

    it('should return false for different playerId', () => {
      const trackRef1 = TrackReferenceVO.create('track-123', 'player-456', 1);
      const trackRef2 = TrackReferenceVO.create('track-123', 'player-789', 1);

      expect(trackRef1.equals(trackRef2)).toBe(false);
    });

    it('should return false for different roundNumber', () => {
      const trackRef1 = TrackReferenceVO.create('track-123', 'player-456', 1);
      const trackRef2 = TrackReferenceVO.create('track-123', 'player-456', 2);

      expect(trackRef1.equals(trackRef2)).toBe(false);
    });

    it('should return false when comparing with null', () => {
      const trackRef = TrackReferenceVO.create('track-123', 'player-456', 1);

      expect(trackRef.equals(null as any)).toBe(false);
    });

    it('should return false when comparing with different type', () => {
      const trackRef = TrackReferenceVO.create('track-123', 'player-456', 1);

      expect(trackRef.equals('some-string' as any)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return formatted string representation', () => {
      const trackRef = TrackReferenceVO.create('track-123', 'player-456', 1);

      expect(trackRef.toString()).toBe('Track(track-123) by Player(player-456) in Round 1');
    });

    it('should handle different round numbers', () => {
      const trackRef = TrackReferenceVO.create('track-123', 'player-456', 5);

      expect(trackRef.toString()).toBe('Track(track-123) by Player(player-456) in Round 5');
    });
  });

  describe('toJSON', () => {
    it('should serialize to object with all properties', () => {
      const createdAt = new Date('2023-01-01T00:00:00Z');
      const trackRef = TrackReferenceVO.create('track-123', 'player-456', 1, createdAt);
      const json = trackRef.toJSON();

      expect(json).toEqual({
        trackId: 'track-123',
        playerId: 'player-456',
        roundNumber: 1,
        createdAt: '2023-01-01T00:00:00.000Z'
      });
    });

    it('should be JSON serializable', () => {
      const trackRef = TrackReferenceVO.create('track-123', 'player-456', 1);
      const serialized = JSON.stringify({ trackRef });
      const parsed = JSON.parse(serialized);

      expect(parsed.trackRef).toHaveProperty('trackId', 'track-123');
      expect(parsed.trackRef).toHaveProperty('playerId', 'player-456');
      expect(parsed.trackRef).toHaveProperty('roundNumber', 1);
      expect(parsed.trackRef).toHaveProperty('createdAt');
    });
  });

  describe('getters', () => {
    it('should provide access to all properties', () => {
      const createdAt = new Date('2023-01-01T00:00:00Z');
      const trackRef = TrackReferenceVO.create('track-123', 'player-456', 1, createdAt);

      expect(trackRef.trackId).toBe('track-123');
      expect(trackRef.playerId).toBe('player-456');
      expect(trackRef.roundNumber).toBe(1);
      expect(trackRef.createdAt).toBe(createdAt);
    });
  });

  describe('validation', () => {
    it('should validate trackId and playerId are not null', () => {
      expect(() => {
        TrackReferenceVO.create(null as any, 'player-456', 1);
      }).toThrow('Track ID and player ID are required');

      expect(() => {
        TrackReferenceVO.create('track-123', null as any, 1);
      }).toThrow('Track ID and player ID are required');
    });

    it('should validate round number is positive', () => {
      expect(() => {
        TrackReferenceVO.create('track-123', 'player-456', 0);
      }).toThrow('Round number must be positive');
    });
  });
}); 