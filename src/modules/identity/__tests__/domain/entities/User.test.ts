import { User } from '../../../domain/entities/User';
import { UpdateUserDTO } from '../../../application/dtos/UserDTO';
import { UserRegisteredEvent } from '../../../domain/events/UserRegisteredEvent';
import { UserLoggedInEvent } from '../../../domain/events/UserLoggedInEvent';
import { UserLoggedOutEvent } from '../../../domain/events/UserLoggedOutEvent';
import { UserProfileUpdatedEvent } from '../../../domain/events/UserProfileUpdatedEvent';
import { PasswordChangedEvent } from '../../../domain/events/PasswordChangedEvent';

describe('User', () => {
  let user: User;
  const validUserId = '550e8400-e29b-41d4-a716-446655440000';
  const validUserId2 = '550e8400-e29b-41d4-a716-446655440001';

  beforeEach(() => {
    jest.useFakeTimers();
    user = new User(
      validUserId,
      'test@example.com',
      'testuser',
      new Date(),
      new Date(),
      'John',
      'Doe',
      'avatar.jpg'
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('constructor', () => {
    it('should create a user with all properties', () => {
      expect(user.idString).toBe(validUserId);
      expect(user.email).toBe('test@example.com');
      expect(user.username).toBe('testuser');
      expect(user.firstName).toBe('John');
      expect(user.lastName).toBe('Doe');
      expect(user.avatar).toBe('avatar.jpg');
    });

    it('should create a user with minimal properties', () => {
      const minimalUser = new User(
        validUserId2,
        'minimal@example.com',
        'minimal',
        new Date(),
        new Date()
      );

      expect(minimalUser.idString).toBe(validUserId2);
      expect(minimalUser.email).toBe('minimal@example.com');
      expect(minimalUser.username).toBe('minimal');
      expect(minimalUser.firstName).toBeUndefined();
      expect(minimalUser.lastName).toBeUndefined();
      expect(minimalUser.avatar).toBeUndefined();
    });

    it('should emit UserRegisteredEvent on creation', () => {
      const events = user.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(UserRegisteredEvent);
      expect((events[0] as UserRegisteredEvent).userId).toBe(validUserId);
      expect((events[0] as UserRegisteredEvent).email).toBe('test@example.com');
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', () => {
      const updateData: UpdateUserDTO = {
        firstName: 'Jane',
        lastName: 'Smith',
        avatar: 'new-avatar.jpg'
      };

      user.updateProfile(updateData);

      expect(user.firstName).toBe('Jane');
      expect(user.lastName).toBe('Smith');
      expect(user.avatar).toBe('new-avatar.jpg');
    });

    it('should update partial profile data', () => {
      const updateData: UpdateUserDTO = {
        firstName: 'Jane'
      };

      user.updateProfile(updateData);

      expect(user.firstName).toBe('Jane');
      expect(user.lastName).toBe('Doe'); // unchanged
      expect(user.avatar).toBe('avatar.jpg'); // unchanged
    });

    it('should emit UserProfileUpdatedEvent on profile update', () => {
      const updateData: UpdateUserDTO = {
        firstName: 'Jane'
      };

      user.updateProfile(updateData);
      const events = user.getDomainEvents();
      const lastEvent = events[events.length - 1];
      
      expect(lastEvent).toBeInstanceOf(UserProfileUpdatedEvent);
      expect((lastEvent as UserProfileUpdatedEvent).userId).toBe(validUserId);
      expect((lastEvent as UserProfileUpdatedEvent).email).toBe('test@example.com');
    });
  });

  describe('login/logout', () => {
    it('should handle login correctly', () => {
      user.login();
      const events = user.getDomainEvents();
      const lastEvent = events[events.length - 1];
      
      expect(lastEvent).toBeInstanceOf(UserLoggedInEvent);
      expect((lastEvent as UserLoggedInEvent).userId).toBe(validUserId);
      expect((lastEvent as UserLoggedInEvent).email).toBe('test@example.com');
    });

    it('should handle logout correctly', () => {
      user.logout();
      const events = user.getDomainEvents();
      const lastEvent = events[events.length - 1];
      
      expect(lastEvent).toBeInstanceOf(UserLoggedOutEvent);
    });
  });

  describe('changePassword', () => {
    it('should emit PasswordChangedEvent on password change', () => {
      user.changePassword();
      const events = user.getDomainEvents();
      const lastEvent = events[events.length - 1];
      
      expect(lastEvent).toBeInstanceOf(PasswordChangedEvent);
    });
  });

  describe('equals', () => {
    it('should return true for same user', () => {
      const sameUser = new User(
        validUserId,
        'test@example.com',
        'testuser',
        new Date(),
        new Date(),
        'John',
        'Doe',
        'avatar.jpg'
      );

      expect(user.equals(sameUser)).toBe(true);
    });

    it('should return false for different user', () => {
      const differentUser = new User(
        validUserId2,
        'other@example.com',
        'otheruser',
        new Date(),
        new Date()
      );

      expect(user.equals(differentUser)).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(user.equals(null as any)).toBe(false);
      expect(user.equals(undefined as any)).toBe(false);
    });
  });

  describe('timestamp updates', () => {
    it('should update timestamp on login', () => {
      const originalUpdatedAt = user.updatedAt;
      jest.advanceTimersByTime(1000); // Advance time by 1 second
      user.login();
      expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('should update timestamp on logout', () => {
      const originalUpdatedAt = user.updatedAt;
      jest.advanceTimersByTime(1000); // Advance time by 1 second
      user.logout();
      expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('should update timestamp on profile update', () => {
      const originalUpdatedAt = user.updatedAt;
      jest.advanceTimersByTime(1000); // Advance time by 1 second
      user.updateProfile({ firstName: 'Jane' });
      expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('should update timestamp on password change', () => {
      const originalUpdatedAt = user.updatedAt;
      jest.advanceTimersByTime(1000); // Advance time by 1 second
      user.changePassword();
      expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
}); 
