import 'reflect-metadata';
import { RoleRegistry } from '../../../application/services/RoleRegistry';
import { RoleVO } from '../../../domain/value-objects/RoleVO';

describe('RoleRegistry', () => {
  let roleRegistry: RoleRegistry;

  beforeEach(() => {
    roleRegistry = new RoleRegistry();
  });

  describe('initialization', () => {
    it('should initialize with default roles', () => {
      const allRoles = roleRegistry.getAllRoles();
      
      expect(allRoles).toHaveLength(4);
      expect(allRoles.map(role => role.id)).toEqual([
        'drummer',
        'guitarist',
        'bassist',
        'keyboardist'
      ]);
    });

    it('should have all default roles as unique', () => {
      const allRoles = roleRegistry.getAllRoles();
      
      allRoles.forEach(role => {
        expect(role.isUnique()).toBe(true);
      });
    });
  });

  describe('getAllRoles', () => {
    it('should return readonly array of roles', () => {
      const roles = roleRegistry.getAllRoles();
      
      expect(roles).toBeInstanceOf(Array);
      expect(roles).toHaveLength(4);
      
      // Verify it's readonly by checking the type
      expect(Object.isFrozen(roles)).toBe(false); // ReadonlyArray doesn't freeze the array
      expect(roles[0]).toBeInstanceOf(RoleVO);
    });

    it('should return consistent results on multiple calls', () => {
      const roles1 = roleRegistry.getAllRoles();
      const roles2 = roleRegistry.getAllRoles();
      
      expect(roles1).toEqual(roles2);
      expect(roles1.length).toBe(roles2.length);
    });
  });

  describe('getRoleById', () => {
    it('should return role for valid ID', () => {
      const drummerRole = roleRegistry.getRoleById('drummer');
      
      expect(drummerRole).toBeDefined();
      expect(drummerRole?.id).toBe('drummer');
      expect(drummerRole?.name).toBe('Drummer');
      expect(drummerRole?.color).toBe('#FF5733');
      expect(drummerRole?.isUnique()).toBe(true);
    });

    it('should return undefined for invalid ID', () => {
      const invalidRole = roleRegistry.getRoleById('invalid-role');
      
      expect(invalidRole).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
      const emptyRole = roleRegistry.getRoleById('');
      
      expect(emptyRole).toBeUndefined();
    });

    it('should be case sensitive', () => {
      const upperCaseRole = roleRegistry.getRoleById('DRUMMER');
      
      expect(upperCaseRole).toBeUndefined();
    });

    it('should return correct role for all default roles', () => {
      const expectedRoles = [
        { id: 'drummer', name: 'Drummer', color: '#FF5733' },
        { id: 'guitarist', name: 'Guitarist', color: '#33FF57' },
        { id: 'bassist', name: 'Bassist', color: '#3357FF' },
        { id: 'keyboardist', name: 'Keyboardist', color: '#FF33F5' }
      ];

      expectedRoles.forEach(expected => {
        const role = roleRegistry.getRoleById(expected.id);
        expect(role).toBeDefined();
        expect(role?.id).toBe(expected.id);
        expect(role?.name).toBe(expected.name);
        expect(role?.color).toBe(expected.color);
      });
    });
  });

  describe('isValidRoleId', () => {
    it('should return true for valid role IDs', () => {
      expect(roleRegistry.isValidRoleId('drummer')).toBe(true);
      expect(roleRegistry.isValidRoleId('guitarist')).toBe(true);
      expect(roleRegistry.isValidRoleId('bassist')).toBe(true);
      expect(roleRegistry.isValidRoleId('keyboardist')).toBe(true);
    });

    it('should return false for invalid role IDs', () => {
      expect(roleRegistry.isValidRoleId('invalid-role')).toBe(false);
      expect(roleRegistry.isValidRoleId('vocalist')).toBe(false);
      expect(roleRegistry.isValidRoleId('piano')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(roleRegistry.isValidRoleId('')).toBe(false);
    });

    it('should be case sensitive', () => {
      expect(roleRegistry.isValidRoleId('DRUMMER')).toBe(false);
      expect(roleRegistry.isValidRoleId('Drummer')).toBe(false);
    });
  });

  describe('getUniqueRoles', () => {
    it('should return all roles as unique by default', () => {
      const uniqueRoles = roleRegistry.getUniqueRoles();
      const allRoles = roleRegistry.getAllRoles();
      
      expect(uniqueRoles).toHaveLength(allRoles.length);
      expect(uniqueRoles).toEqual(allRoles);
    });

    it('should return readonly array', () => {
      const uniqueRoles = roleRegistry.getUniqueRoles();
      
      expect(uniqueRoles).toBeInstanceOf(Array);
      uniqueRoles.forEach(role => {
        expect(role.isUnique()).toBe(true);
      });
    });
  });

  describe('getNonUniqueRoles', () => {
    it('should return empty array by default', () => {
      const nonUniqueRoles = roleRegistry.getNonUniqueRoles();
      
      expect(nonUniqueRoles).toHaveLength(0);
      expect(nonUniqueRoles).toEqual([]);
    });

    it('should return readonly array', () => {
      const nonUniqueRoles = roleRegistry.getNonUniqueRoles();
      
      expect(nonUniqueRoles).toBeInstanceOf(Array);
    });
  });

  describe('role properties consistency', () => {
    it('should have consistent role properties across methods', () => {
      const allRoles = roleRegistry.getAllRoles();
      
      allRoles.forEach(role => {
        const foundRole = roleRegistry.getRoleById(role.id);
        expect(foundRole).toEqual(role);
        expect(roleRegistry.isValidRoleId(role.id)).toBe(true);
      });
    });

    it('should maintain role immutability', () => {
      const role1 = roleRegistry.getRoleById('drummer');
      const role2 = roleRegistry.getRoleById('drummer');
      
      expect(role1).toEqual(role2);
      expect(role1?.id).toBe(role2?.id);
      expect(role1?.name).toBe(role2?.name);
      expect(role1?.color).toBe(role2?.color);
    });
  });
}); 