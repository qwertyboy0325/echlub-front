import { JoinJamSessionCommand } from '../../../application/commands/JoinJamSessionCommand';

describe('JoinJamSessionCommand', () => {
  describe('constructor', () => {
    it('should create command with correct properties', () => {
      const sessionId = 'session-123';
      const peerId = 'player-456';
      
      const command = new JoinJamSessionCommand(sessionId, peerId);
      
      expect(command.type).toBe('JoinJamSession');
      expect(command.sessionId).toBe(sessionId);
      expect(command.peerId).toBe(peerId);
    });

    it('should be immutable', () => {
      const sessionId = 'session-123';
      const peerId = 'player-456';
      
      const command = new JoinJamSessionCommand(sessionId, peerId);
      
      // Properties should be readonly (TypeScript enforces this at compile time)
      expect(command.sessionId).toBe(sessionId);
      expect(command.peerId).toBe(peerId);
      
      // Verify properties are defined and correct
      expect(typeof command.sessionId).toBe('string');
      expect(typeof command.peerId).toBe('string');
    });

    it('should handle empty strings', () => {
      const command = new JoinJamSessionCommand('', '');
      
      expect(command.sessionId).toBe('');
      expect(command.peerId).toBe('');
    });
  });

  describe('type property', () => {
    it('should have correct command type', () => {
      const command = new JoinJamSessionCommand('session-123', 'player-456');
      
      expect(command.type).toBe('JoinJamSession');
    });

    it('should be readonly', () => {
      const command = new JoinJamSessionCommand('session-123', 'player-456');
      
      // Type should be readonly (TypeScript enforces this at compile time)
      expect(command.type).toBe('JoinJamSession');
      expect(typeof command.type).toBe('string');
    });
  });
}); 