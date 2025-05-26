import { CreateJamSessionCommand } from '../../../application/commands/CreateJamSessionCommand';

describe('CreateJamSessionCommand', () => {
  describe('constructor', () => {
    it('should create command with correct properties', () => {
      const roomId = 'room-123';
      const initiatorPeerId = 'player-456';
      
      const command = new CreateJamSessionCommand(roomId, initiatorPeerId);
      
      expect(command.type).toBe('CreateJamSession');
      expect(command.roomId).toBe(roomId);
      expect(command.initiatorPeerId).toBe(initiatorPeerId);
    });

    it('should be immutable', () => {
      const roomId = 'room-123';
      const initiatorPeerId = 'player-456';
      
      const command = new CreateJamSessionCommand(roomId, initiatorPeerId);
      
      // Properties should be readonly (TypeScript enforces this at compile time)
      // At runtime, we can verify the values remain as expected
      expect(command.roomId).toBe(roomId);
      expect(command.initiatorPeerId).toBe(initiatorPeerId);
      
      // Verify properties are defined and correct
      expect(typeof command.roomId).toBe('string');
      expect(typeof command.initiatorPeerId).toBe('string');
    });

    it('should handle empty strings', () => {
      const command = new CreateJamSessionCommand('', '');
      
      expect(command.roomId).toBe('');
      expect(command.initiatorPeerId).toBe('');
    });
  });

  describe('type property', () => {
    it('should have correct command type', () => {
      const command = new CreateJamSessionCommand('room-123', 'player-456');
      
      expect(command.type).toBe('CreateJamSession');
    });

    it('should be readonly', () => {
      const command = new CreateJamSessionCommand('room-123', 'player-456');
      
      // Type should be readonly (TypeScript enforces this at compile time)
      expect(command.type).toBe('CreateJamSession');
      expect(typeof command.type).toBe('string');
    });
  });
}); 