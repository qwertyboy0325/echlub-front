import { EndJamSessionCommand } from '../../../application/commands/EndJamSessionCommand';

describe('EndJamSessionCommand', () => {
  describe('constructor', () => {
    it('should create command with sessionId and initiatorPeerId', () => {
      const sessionId = 'session-123';
      const initiatorPeerId = 'peer-456';
      const command = new EndJamSessionCommand(sessionId, initiatorPeerId);

      expect(command.sessionId).toBe(sessionId);
      expect(command.initiatorPeerId).toBe(initiatorPeerId);
      expect(command.type).toBe('EndJamSession');
    });

    it('should handle empty values', () => {
      const command = new EndJamSessionCommand('', '');

      expect(command.sessionId).toBe('');
      expect(command.initiatorPeerId).toBe('');
      expect(command.type).toBe('EndJamSession');
    });

    it('should handle UUID format values', () => {
      const sessionId = '550e8400-e29b-41d4-a716-446655440000';
      const initiatorPeerId = '660e8400-e29b-41d4-a716-446655440001';
      const command = new EndJamSessionCommand(sessionId, initiatorPeerId);

      expect(command.sessionId).toBe(sessionId);
      expect(command.initiatorPeerId).toBe(initiatorPeerId);
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const command = new EndJamSessionCommand('session-123', 'peer-456');

      // TypeScript compile-time check for readonly properties
      // Verify properties are accessible
      expect(command.sessionId).toBe('session-123');
      expect(command.initiatorPeerId).toBe('peer-456');
      expect(command.type).toBe('EndJamSession');
      
      // Properties should be readonly (TypeScript compile-time check)
      expect(typeof command.sessionId).toBe('string');
      expect(typeof command.initiatorPeerId).toBe('string');

      // TypeScript readonly properties don't throw at runtime
      // This is a compile-time check only
      expect(command.type).toBe('EndJamSession');
    });
  });

  describe('type checking', () => {
    it('should implement ICommand interface', () => {
      const command = new EndJamSessionCommand('session-123', 'peer-456');

      expect(command).toHaveProperty('type');
      expect(typeof command.type).toBe('string');
    });
  });
}); 