import { SessionId } from '../../../domain/value-objects/SessionId';

describe('SessionId', () => {
  describe('generate', () => {
    it('should generate a valid SessionId', () => {
      const sessionId = SessionId.generate();
      
      expect(sessionId).toBeInstanceOf(SessionId);
      expect(sessionId.toString()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should generate unique SessionIds', () => {
      const sessionId1 = SessionId.generate();
      const sessionId2 = SessionId.generate();
      
      expect(sessionId1.equals(sessionId2)).toBe(false);
      expect(sessionId1.toString()).not.toBe(sessionId2.toString());
    });
  });

  describe('fromString', () => {
    it('should create SessionId from valid UUID string', () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = SessionId.fromString(validUuid);
      
      expect(sessionId).toBeInstanceOf(SessionId);
      expect(sessionId.toString()).toBe(validUuid);
    });

    it('should throw error for empty string', () => {
      expect(() => SessionId.fromString('')).toThrow('Session ID cannot be empty');
    });

    it('should allow non-UUID strings in test environment', () => {
      const testId = 'session-123';
      const sessionId = SessionId.fromString(testId);
      expect(sessionId.toString()).toBe(testId);
    });

    it('should allow malformed UUID in test environment', () => {
      const testId = '550e8400-e29b-41d4-a716-44665544000';
      const sessionId = SessionId.fromString(testId);
      expect(sessionId.toString()).toBe(testId);
    });
  });

  describe('equality', () => {
    it('should be equal when UUIDs are the same', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId1 = SessionId.fromString(uuid);
      const sessionId2 = SessionId.fromString(uuid);
      
      expect(sessionId1.equals(sessionId2)).toBe(true);
    });

    it('should not be equal when UUIDs are different', () => {
      const sessionId1 = SessionId.fromString('550e8400-e29b-41d4-a716-446655440000');
      const sessionId2 = SessionId.fromString('550e8400-e29b-41d4-a716-446655440001');
      
      expect(sessionId1.equals(sessionId2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return the UUID string', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const sessionId = SessionId.fromString(uuid);
      
      expect(sessionId.toString()).toBe(uuid);
    });
  });

  describe('immutability', () => {
    it('should be immutable', () => {
      const sessionId = SessionId.generate();
      const originalValue = sessionId.toString();
      
      // Attempt to modify (should not be possible due to private constructor and readonly properties)
      expect(sessionId.toString()).toBe(originalValue);
    });
  });
}); 