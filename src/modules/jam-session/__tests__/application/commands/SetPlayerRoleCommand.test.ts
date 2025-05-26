import { SetPlayerRoleCommand } from '../../../application/commands/SetPlayerRoleCommand';

describe('SetPlayerRoleCommand', () => {
  describe('constructor', () => {
    it('should create command with correct properties', () => {
      const sessionId = 'session-123';
      const peerId = 'player-456';
      const roleId = 'drummer';
      const roleName = 'Drummer';
      const roleColor = '#FF5722';
      
      const command = new SetPlayerRoleCommand(sessionId, peerId, roleId, roleName, roleColor);
      
      expect(command.type).toBe('SetPlayerRole');
      expect(command.sessionId).toBe(sessionId);
      expect(command.peerId).toBe(peerId);
      expect(command.roleId).toBe(roleId);
      expect(command.roleName).toBe(roleName);
      expect(command.roleColor).toBe(roleColor);
    });

    it('should be immutable', () => {
      const sessionId = 'session-123';
      const peerId = 'player-456';
      const roleId = 'drummer';
      const roleName = 'Drummer';
      const roleColor = '#FF5722';
      
      const command = new SetPlayerRoleCommand(sessionId, peerId, roleId, roleName, roleColor);
      
      // Properties should be readonly (TypeScript enforces this at compile time)
      expect(command.sessionId).toBe(sessionId);
      expect(command.peerId).toBe(peerId);
      expect(command.roleId).toBe(roleId);
      expect(command.roleName).toBe(roleName);
      expect(command.roleColor).toBe(roleColor);
      
      // Verify properties are defined and correct
      expect(typeof command.sessionId).toBe('string');
      expect(typeof command.peerId).toBe('string');
      expect(typeof command.roleId).toBe('string');
      expect(typeof command.roleName).toBe('string');
      expect(typeof command.roleColor).toBe('string');
    });

    it('should handle empty strings', () => {
      const command = new SetPlayerRoleCommand('', '', '', '', '');
      
      expect(command.sessionId).toBe('');
      expect(command.peerId).toBe('');
      expect(command.roleId).toBe('');
      expect(command.roleName).toBe('');
      expect(command.roleColor).toBe('');
    });

    it('should handle special characters in role properties', () => {
      const sessionId = 'session-123';
      const peerId = 'player-456';
      const roleId = 'lead-guitarist';
      const roleName = 'Lead Guitarist & Vocalist';
      const roleColor = '#FF5722';
      
      const command = new SetPlayerRoleCommand(sessionId, peerId, roleId, roleName, roleColor);
      
      expect(command.roleId).toBe(roleId);
      expect(command.roleName).toBe(roleName);
      expect(command.roleColor).toBe(roleColor);
    });
  });

  describe('type property', () => {
    it('should have correct command type', () => {
      const command = new SetPlayerRoleCommand('session-123', 'player-456', 'drummer', 'Drummer', '#FF5722');
      
      expect(command.type).toBe('SetPlayerRole');
    });

    it('should be readonly', () => {
      const command = new SetPlayerRoleCommand('session-123', 'player-456', 'drummer', 'Drummer', '#FF5722');
      
      // Type should be readonly (TypeScript enforces this at compile time)
      expect(command.type).toBe('SetPlayerRole');
      expect(typeof command.type).toBe('string');
    });
  });
}); 