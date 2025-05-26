import { RoundId } from '../../../domain/value-objects/RoundId';

describe('RoundId', () => {
  describe('create', () => {
    it('should create a new RoundId with UUID', () => {
      const roundId = RoundId.create();

      expect(roundId).toBeInstanceOf(RoundId);
      expect(roundId.toString()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should create different IDs on multiple calls', () => {
      const roundId1 = RoundId.create();
      const roundId2 = RoundId.create();

      expect(roundId1.toString()).not.toBe(roundId2.toString());
    });
  });

  describe('fromString', () => {
    it('should create RoundId from valid UUID string', () => {
      const uuidString = '550e8400-e29b-41d4-a716-446655440000';
      const roundId = RoundId.fromString(uuidString);

      expect(roundId).toBeInstanceOf(RoundId);
      expect(roundId.toString()).toBe(uuidString);
    });

    it('should throw error for invalid UUID format', () => {
      expect(() => {
        RoundId.fromString('invalid-uuid');
      }).toThrow('Invalid UUID format');
    });

    it('should throw error for empty string', () => {
      expect(() => {
        RoundId.fromString('');
      }).toThrow('Invalid UUID format');
    });

    it('should throw error for null or undefined', () => {
      expect(() => {
        RoundId.fromString(null as any);
      }).toThrow();

      expect(() => {
        RoundId.fromString(undefined as any);
      }).toThrow();
    });
  });

  describe('equals', () => {
    it('should return true for same UUID values', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const roundId1 = RoundId.fromString(uuid);
      const roundId2 = RoundId.fromString(uuid);

      expect(roundId1.equals(roundId2)).toBe(true);
    });

    it('should return false for different UUID values', () => {
      const roundId1 = RoundId.fromString('550e8400-e29b-41d4-a716-446655440000');
      const roundId2 = RoundId.fromString('660e8400-e29b-41d4-a716-446655440001');

      expect(roundId1.equals(roundId2)).toBe(false);
    });

    it('should return false when comparing with null', () => {
      const roundId = RoundId.create();

      expect(roundId.equals(null as any)).toBe(false);
    });

    it('should return false when comparing with different type', () => {
      const roundId = RoundId.create();

      expect(roundId.equals('some-string' as any)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return the UUID string', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const roundId = RoundId.fromString(uuid);

      expect(roundId.toString()).toBe(uuid);
    });

    it('should return consistent string representation', () => {
      const roundId = RoundId.create();
      const str1 = roundId.toString();
      const str2 = roundId.toString();

      expect(str1).toBe(str2);
    });
  });

  describe('toJSON', () => {
    it('should serialize to UUID string', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const roundId = RoundId.fromString(uuid);

      expect(roundId.toJSON()).toBe(uuid);
    });

    it('should be JSON serializable', () => {
      const roundId = RoundId.create();
      const serialized = JSON.stringify({ roundId });
      const parsed = JSON.parse(serialized);

      expect(parsed.roundId).toBe(roundId.toString());
    });
  });

  describe('immutability', () => {
    it('should be immutable', () => {
      const roundId = RoundId.create();
      const originalString = roundId.toString();

      // Value object should maintain its value
      expect(roundId.toString()).toBe(originalString);
      
      // Verify that toString returns consistent values
      expect(roundId.toString()).toBe(roundId.toString());
    });
  });
}); 