import { EndCurrentRoundCommand } from '../../../application/commands/EndCurrentRoundCommand';

describe('EndCurrentRoundCommand', () => {
  describe('constructor', () => {
    it('should create command with sessionId', () => {
      const sessionId = 'session-123';
      const command = new EndCurrentRoundCommand(sessionId);

      expect(command.sessionId).toBe(sessionId);
      expect(command.type).toBe('EndCurrentRound');
    });

    it('should handle empty sessionId', () => {
      const command = new EndCurrentRoundCommand('');

      expect(command.sessionId).toBe('');
      expect(command.type).toBe('EndCurrentRound');
    });

    it('should handle special characters in sessionId', () => {
      const sessionId = 'session-123-@#$%';
      const command = new EndCurrentRoundCommand(sessionId);

      expect(command.sessionId).toBe(sessionId);
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const command = new EndCurrentRoundCommand('session-123');

      // Verify properties are accessible
      expect(command.sessionId).toBe('session-123');
      expect(command.type).toBe('EndCurrentRound');
      
      // Properties should be readonly (TypeScript compile-time check)
      expect(typeof command.sessionId).toBe('string');
      expect(typeof command.type).toBe('string');
    });
  });

  describe('type checking', () => {
    it('should implement ICommand interface', () => {
      const command = new EndCurrentRoundCommand('session-123');

      expect(command).toHaveProperty('type');
      expect(typeof command.type).toBe('string');
    });
  });
}); 