import { RoleVO } from '../../../domain/value-objects/RoleVO';

describe('RoleVO', () => {
  describe('create', () => {
    it('should create a role with all properties', () => {
      const role = RoleVO.create('drummer', 'Drummer', '#FF5733', true);
      
      expect(role).toBeInstanceOf(RoleVO);
      expect(role.id).toBe('drummer');
      expect(role.name).toBe('Drummer');
      expect(role.color).toBe('#FF5733');
      expect(role.isUnique()).toBe(true);
    });

    it('should create a role with default isUnique as true', () => {
      const role = RoleVO.create('guitarist', 'Guitarist', '#33FF57');
      
      expect(role.isUnique()).toBe(true);
    });

    it('should create a non-unique role when specified', () => {
      const role = RoleVO.create('backup', 'Backup Singer', '#5733FF', false);
      
      expect(role.isUnique()).toBe(false);
    });

    it('should throw error for empty id', () => {
      expect(() => RoleVO.create('', 'Drummer', '#FF5733')).toThrow('Role properties cannot be empty');
    });

    it('should throw error for empty name', () => {
      expect(() => RoleVO.create('drummer', '', '#FF5733')).toThrow('Role properties cannot be empty');
    });

    it('should throw error for empty color', () => {
      expect(() => RoleVO.create('drummer', 'Drummer', '')).toThrow('Role properties cannot be empty');
    });
  });

  describe('equality', () => {
    it('should be equal when ids are the same', () => {
      const role1 = RoleVO.create('drummer', 'Drummer', '#FF5733');
      const role2 = RoleVO.create('drummer', 'Different Name', '#000000');
      
      expect(role1.equals(role2)).toBe(true);
    });

    it('should not be equal when ids are different', () => {
      const role1 = RoleVO.create('drummer', 'Drummer', '#FF5733');
      const role2 = RoleVO.create('guitarist', 'Drummer', '#FF5733');
      
      expect(role1.equals(role2)).toBe(false);
    });
  });

  describe('withColor', () => {
    it('should create new instance with updated color', () => {
      const originalRole = RoleVO.create('drummer', 'Drummer', '#FF5733');
      const updatedRole = originalRole.withColor('#000000');
      
      expect(updatedRole).not.toBe(originalRole);
      expect(updatedRole.color).toBe('#000000');
      expect(updatedRole.id).toBe(originalRole.id);
      expect(updatedRole.name).toBe(originalRole.name);
      expect(updatedRole.isUnique()).toBe(originalRole.isUnique());
      
      // Original should remain unchanged
      expect(originalRole.color).toBe('#FF5733');
    });

    it('should throw error for empty color', () => {
      const role = RoleVO.create('drummer', 'Drummer', '#FF5733');
      
      expect(() => role.withColor('')).toThrow('Color cannot be empty');
    });
  });

  describe('withName', () => {
    it('should create new instance with updated name', () => {
      const originalRole = RoleVO.create('drummer', 'Drummer', '#FF5733');
      const updatedRole = originalRole.withName('Lead Drummer');
      
      expect(updatedRole).not.toBe(originalRole);
      expect(updatedRole.name).toBe('Lead Drummer');
      expect(updatedRole.id).toBe(originalRole.id);
      expect(updatedRole.color).toBe(originalRole.color);
      expect(updatedRole.isUnique()).toBe(originalRole.isUnique());
      
      // Original should remain unchanged
      expect(originalRole.name).toBe('Drummer');
    });

    it('should throw error for empty name', () => {
      const role = RoleVO.create('drummer', 'Drummer', '#FF5733');
      
      expect(() => role.withName('')).toThrow('Name cannot be empty');
    });
  });

  describe('serialization', () => {
    it('should serialize to JSON correctly', () => {
      const role = RoleVO.create('drummer', 'Drummer', '#FF5733', false);
      const json = role.toJSON();
      
      expect(json).toEqual({
        id: 'drummer',
        name: 'Drummer',
        color: '#FF5733',
        isUnique: false
      });
    });

    it('should have meaningful string representation', () => {
      const role = RoleVO.create('drummer', 'Drummer', '#FF5733');
      
      expect(role.toString()).toBe('Role(Drummer)');
    });
  });

  describe('immutability', () => {
    it('should be immutable', () => {
      const role = RoleVO.create('drummer', 'Drummer', '#FF5733');
      const originalId = role.id;
      const originalName = role.name;
      const originalColor = role.color;
      const originalIsUnique = role.isUnique();
      
      // Properties should remain unchanged
      expect(role.id).toBe(originalId);
      expect(role.name).toBe(originalName);
      expect(role.color).toBe(originalColor);
      expect(role.isUnique()).toBe(originalIsUnique);
    });
  });
}); 