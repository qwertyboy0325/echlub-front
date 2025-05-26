import { InMemorySessionRepository } from '../../../infrastructure/repositories/InMemorySessionRepository';
import { Session } from '../../../domain/aggregates/Session';
import { SessionId } from '../../../domain/value-objects/SessionId';

describe('InMemorySessionRepository', () => {
  let repository: InMemorySessionRepository;
  let session1: Session;
  let session2: Session;
  let sessionId1: SessionId;
  let sessionId2: SessionId;

  beforeEach(() => {
    repository = new InMemorySessionRepository();
    
    // Create test sessions
    sessionId1 = SessionId.generate();
    sessionId2 = SessionId.generate();
    
    session1 = Session.create(
      sessionId1,
      'room-1',
      'peer-1'
    );
    
    session2 = Session.create(
      sessionId2,
      'room-2',
      'peer-2'
    );
    
    // Add players to sessions
    session1.addPlayer('peer-3');
    
    session2.addPlayer('peer-4');
  });

  describe('save', () => {
    it('should save session successfully', async () => {
      await repository.save(session1);

      const retrieved = await repository.findById(sessionId1);
      expect(retrieved).toBe(session1);
    });

    it('should overwrite existing session with same ID', async () => {
      await repository.save(session1);
      
      // Modify session
      session1.addPlayer('peer-5');
      await repository.save(session1);

      const retrieved = await repository.findById(sessionId1);
      expect(retrieved).toBe(session1);
      expect(retrieved?.players.size).toBe(3); // Original 2 + 1 new
    });

    it('should save multiple sessions', async () => {
      await repository.save(session1);
      await repository.save(session2);

      const retrieved1 = await repository.findById(sessionId1);
      const retrieved2 = await repository.findById(sessionId2);

      expect(retrieved1).toBe(session1);
      expect(retrieved2).toBe(session2);
    });
  });

  describe('findById', () => {
    beforeEach(async () => {
      await repository.save(session1);
      await repository.save(session2);
    });

    it('should find session by ID', async () => {
      const result = await repository.findById(sessionId1);

      expect(result).toBe(session1);
    });

    it('should return null for non-existent session', async () => {
      const nonExistentId = SessionId.generate();
      const result = await repository.findById(nonExistentId);

      expect(result).toBeNull();
    });

    it('should find correct session among multiple', async () => {
      const result1 = await repository.findById(sessionId1);
      const result2 = await repository.findById(sessionId2);

      expect(result1).toBe(session1);
      expect(result2).toBe(session2);
    });
  });

  describe('findByRoomId', () => {
    beforeEach(async () => {
      await repository.save(session1);
      await repository.save(session2);
    });

    it('should find session by room ID', async () => {
      const result = await repository.findByRoomId('room-1');

      expect(result).toBe(session1);
    });

    it('should return null for non-existent room', async () => {
      const result = await repository.findByRoomId('non-existent-room');

      expect(result).toBeNull();
    });

    it('should find correct session among multiple rooms', async () => {
      const result1 = await repository.findByRoomId('room-1');
      const result2 = await repository.findByRoomId('room-2');

      expect(result1).toBe(session1);
      expect(result2).toBe(session2);
    });
  });

  describe('findByPeerId', () => {
    beforeEach(async () => {
      await repository.save(session1);
      await repository.save(session2);
    });

    it('should find session by peer ID', async () => {
      const result = await repository.findByPeerId('peer-1');

      expect(result).toBe(session1);
    });

    it('should return null for non-existent peer', async () => {
      const result = await repository.findByPeerId('non-existent-peer');

      expect(result).toBeNull();
    });

    it('should find session for peer in different rooms', async () => {
      const result1 = await repository.findByPeerId('peer-3');
      const result2 = await repository.findByPeerId('peer-4');

      expect(result1).toBe(session1);
      expect(result2).toBe(session2);
    });

    it('should return first session if peer exists in multiple sessions', async () => {
      // Add same peer to both sessions
      session2.addPlayer('peer-1');
      await repository.save(session2);

      const result = await repository.findByPeerId('peer-1');

      // Should return the first session found (implementation dependent)
      expect(result).toBeDefined();
      expect([session1, session2]).toContain(result);
    });
  });

  describe('delete', () => {
    beforeEach(async () => {
      await repository.save(session1);
      await repository.save(session2);
    });

    it('should delete session successfully', async () => {
      await repository.delete(sessionId1);

      const result = await repository.findById(sessionId1);
      expect(result).toBeNull();
    });

    it('should not affect other sessions when deleting one', async () => {
      await repository.delete(sessionId1);

      const result1 = await repository.findById(sessionId1);
      const result2 = await repository.findById(sessionId2);

      expect(result1).toBeNull();
      expect(result2).toBe(session2);
    });

    it('should handle deleting non-existent session gracefully', async () => {
      const nonExistentId = SessionId.generate();

      await expect(repository.delete(nonExistentId)).resolves.not.toThrow();
    });

    it('should remove session from all lookup methods', async () => {
      await repository.delete(sessionId1);

      const byId = await repository.findById(sessionId1);
      const byRoom = await repository.findByRoomId('room-1');
      const byPeer = await repository.findByPeerId('peer-1');

      expect(byId).toBeNull();
      expect(byRoom).toBeNull();
      expect(byPeer).toBeNull();
    });
  });

  describe('concurrent operations', () => {
    it('should handle concurrent saves', async () => {
      const promises = [
        repository.save(session1),
        repository.save(session2)
      ];

      await Promise.all(promises);

      const result1 = await repository.findById(sessionId1);
      const result2 = await repository.findById(sessionId2);

      expect(result1).toBe(session1);
      expect(result2).toBe(session2);
    });

    it('should handle concurrent reads', async () => {
      await repository.save(session1);

      const promises = [
        repository.findById(sessionId1),
        repository.findByRoomId('room-1'),
        repository.findByPeerId('peer-1')
      ];

      const results = await Promise.all(promises);

      expect(results[0]).toBe(session1);
      expect(results[1]).toBe(session1);
      expect(results[2]).toBe(session1);
    });
  });

  describe('edge cases', () => {
    it('should handle empty repository queries', async () => {
      const byId = await repository.findById(sessionId1);
      const byRoom = await repository.findByRoomId('room-1');
      const byPeer = await repository.findByPeerId('peer-1');

      expect(byId).toBeNull();
      expect(byRoom).toBeNull();
      expect(byPeer).toBeNull();
    });

    it('should handle sessions with no players', async () => {
      const emptySession = Session.create(
        SessionId.generate(),
        'empty-room',
        'initiator'
      );

      await repository.save(emptySession);

      const result = await repository.findByRoomId('empty-room');
      expect(result).toBe(emptySession);
    });
  });
}); 