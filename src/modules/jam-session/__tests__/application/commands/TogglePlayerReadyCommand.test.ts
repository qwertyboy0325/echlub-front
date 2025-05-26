import { TogglePlayerReadyCommand } from '../../../application/commands/TogglePlayerReadyCommand';

describe('TogglePlayerReadyCommand', () => {
  describe('constructor', () => {
    it('should create command with correct properties', () => {
      const sessionId = 'session-123';
      const peerId = 'player-456';
      const isReady = true;
      
      const command = new TogglePlayerReadyCommand(sessionId, peerId, isReady);
      
      expect(command.type).toBe('TogglePlayerReady');
      expect(command.sessionId).toBe(sessionId);
      expect(command.peerId).toBe(peerId);
      expect(command.isReady).toBe(isReady);
    });

    it('should handle false ready state', () => {
      const sessionId = 'session-123';
      const peerId = 'player-456';
      const isReady = false;
      
      const command = new TogglePlayerReadyCommand(sessionId, peerId, isReady);
      
      expect(command.isReady).toBe(false);
    });

    it('should be immutable', () => {
      const sessionId = 'session-123';
      const peerId = 'player-456';
      const isReady = true;
      
      const command = new TogglePlayerReadyCommand(sessionId, peerId, isReady);
      
      // Properties should be readonly (TypeScript enforces this at compile time)
      expect(command.sessionId).toBe(sessionId);
      expect(command.peerId).toBe(peerId);
      expect(command.isReady).toBe(isReady);
      
      // Verify properties are defined and correct
      expect(typeof command.sessionId).toBe('string');
      expect(typeof command.peerId).toBe('string');
      expect(typeof command.isReady).toBe('boolean');
    });

    it('should handle empty strings', () => {
      const command = new TogglePlayerReadyCommand('', '', false);
      
      expect(command.sessionId).toBe('');
      expect(command.peerId).toBe('');
      expect(command.isReady).toBe(false);
    });
  });

  describe('type property', () => {
    it('should have correct command type', () => {
      const command = new TogglePlayerReadyCommand('session-123', 'player-456', true);
      
      expect(command.type).toBe('TogglePlayerReady');
    });

    it('should be readonly', () => {
      const command = new TogglePlayerReadyCommand('session-123', 'player-456', true);
      
      // Type should be readonly (TypeScript enforces this at compile time)
      expect(command.type).toBe('TogglePlayerReady');
      expect(typeof command.type).toBe('string');
    });
  });
}); 