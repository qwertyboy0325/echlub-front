import { StartNextRoundCommand } from '../../../application/commands/StartNextRoundCommand';

describe('StartNextRoundCommand', () => {
  describe('constructor', () => {
    it('should create command with sessionId and durationSeconds', () => {
      const sessionId = 'session-123';
      const durationSeconds = 300;
      const command = new StartNextRoundCommand(sessionId, durationSeconds);

      expect(command.sessionId).toBe(sessionId);
      expect(command.durationSeconds).toBe(durationSeconds);
      expect(command.type).toBe('StartNextRound');
    });

    it('should handle zero duration', () => {
      const command = new StartNextRoundCommand('session-123', 0);

      expect(command.sessionId).toBe('session-123');
      expect(command.durationSeconds).toBe(0);
      expect(command.type).toBe('StartNextRound');
    });

    it('should handle large duration values', () => {
      const sessionId = 'session-123';
      const durationSeconds = 3600; // 1 hour
      const command = new StartNextRoundCommand(sessionId, durationSeconds);

      expect(command.sessionId).toBe(sessionId);
      expect(command.durationSeconds).toBe(durationSeconds);
    });

    it('should handle negative duration', () => {
      const command = new StartNextRoundCommand('session-123', -60);

      expect(command.durationSeconds).toBe(-60);
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const command = new StartNextRoundCommand('session-123', 300);

      // TypeScript compile-time check for readonly properties
      // Verify properties are accessible
      expect(command.sessionId).toBe('session-123');
      expect(command.durationSeconds).toBe(300);
      expect(command.type).toBe('StartNextRound');
      
      // Properties should be readonly (TypeScript compile-time check)
      expect(typeof command.sessionId).toBe('string');
      expect(typeof command.durationSeconds).toBe('number');

      // TypeScript readonly properties don't throw at runtime
      // This is a compile-time check only
      expect(command.type).toBe('StartNextRound');
    });
  });

  describe('type checking', () => {
    it('should implement ICommand interface', () => {
      const command = new StartNextRoundCommand('session-123', 300);

      expect(command).toHaveProperty('type');
      expect(typeof command.type).toBe('string');
      expect(typeof command.durationSeconds).toBe('number');
    });
  });
}); 