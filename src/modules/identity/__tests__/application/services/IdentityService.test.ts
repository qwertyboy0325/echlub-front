import { Container } from 'inversify';
import { IdentityTypes } from '../../../di/IdentityTypes';
import { IdentityService } from '../../../application/services/IdentityService';
import { IdentityMediator } from '../../../application/mediators/IdentityMediator';
import { UserValidator } from '../../../application/validators/UserValidator';
import { User } from '../../../domain/entities/User';
import { AuthResponseDTO, UpdateUserDTO, UserDTO } from '../../../application/dtos/UserDTO';
import { ValidationResult } from '@/core/validation/ValidationResult';
import { UserValidationError, UserOperationError } from '../../../domain/errors/UserError';
import { UpdateUserProfileCommand } from '../../../application/commands/UpdateUserProfileCommand';

// 測試專用常數，避免硬編碼敏感信息
const TEST_CREDENTIALS = {
  PASSWORD: 'test_password_for_tests', // NOSONAR
  OLD_PASSWORD: 'old_test_password', // NOSONAR
  NEW_PASSWORD: 'new_test_password', // NOSONAR
  WRONG_PASSWORD: 'wrong_test_password' // NOSONAR
};

describe('IdentityService', () => {
  let container: Container;
  let identityService: IdentityService;
  let identityMediator: IdentityMediator;
  let userValidator: UserValidator;
  let localStorageMock: { [key: string]: string };

  beforeEach(() => {
    container = new Container();
    localStorageMock = {};

    // Mock localStorage
    global.localStorage = {
      getItem: (key: string) => localStorageMock[key] || null,
      setItem: (key: string, value: string) => { localStorageMock[key] = value; },
      removeItem: (key: string) => { delete localStorageMock[key]; },
      clear: () => { localStorageMock = {}; },
      length: 0,
      key: (index: number) => '',
    };

    identityMediator = {
      registerUser: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
      updateUserProfile: jest.fn(),
      changePassword: jest.fn(),
      getUserProfile: jest.fn()
    } as unknown as IdentityMediator;

    userValidator = {
      validateRegister: jest.fn(),
      validateLogin: jest.fn(),
      validateUpdateProfile: jest.fn(),
      validateChangePassword: jest.fn()
    } as unknown as UserValidator;

    container.bind(IdentityTypes.IdentityMediator).toConstantValue(identityMediator);
    container.bind(IdentityTypes.UserValidator).toConstantValue(userValidator);
    container.bind(IdentityService).toSelf();

    identityService = container.get(IdentityService);
  });

  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      const mockUser = new User(
        '1',
        'test@example.com',
        'testuser',
        new Date(),
        new Date()
      );

      const expectedUserDTO: UserDTO = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt
      };

      (identityMediator.registerUser as jest.Mock).mockResolvedValue(mockUser);
      (userValidator.validateRegister as jest.Mock).mockReturnValue(new ValidationResult(true, []));

      const result = await identityService.registerUser(
        'test@example.com',
        TEST_CREDENTIALS.PASSWORD,
        'testuser'
      );

      expect(result).toEqual(expectedUserDTO);
      expect(identityMediator.registerUser).toHaveBeenCalled();
      expect(userValidator.validateRegister).toHaveBeenCalled();
    });

    it('should throw UserValidationError when validation fails', async () => {
      const validationErrors = ['Invalid email', 'Password too short'];
      (userValidator.validateRegister as jest.Mock).mockReturnValue(
        new ValidationResult(false, validationErrors)
      );

      await expect(identityService.registerUser(
        'invalid',
        'short',
        ''
      )).rejects.toThrow(UserValidationError);
    });

    it('should throw UserOperationError when registration fails', async () => {
      (userValidator.validateRegister as jest.Mock).mockReturnValue(new ValidationResult(true, []));
      (identityMediator.registerUser as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(identityService.registerUser(
        'test@example.com',
        TEST_CREDENTIALS.PASSWORD,
        'testuser'
      )).rejects.toThrow(UserOperationError);
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const mockUser = new User(
        '1',
        'test@example.com',
        'testuser',
        new Date(),
        new Date()
      );

      const mockResponse: AuthResponseDTO = {
        token: 'mock-token',
        user: {
          id: '1',
          email: 'test@example.com',
          username: 'testuser',
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt
        }
      };

      (identityMediator.login as jest.Mock).mockResolvedValue(mockResponse);
      (userValidator.validateLogin as jest.Mock).mockReturnValue(new ValidationResult(true, []));

      const result = await identityService.login(
        'test@example.com',
        TEST_CREDENTIALS.PASSWORD
      );

      expect(result).toEqual(mockResponse);
      expect(identityMediator.login).toHaveBeenCalled();
      expect(userValidator.validateLogin).toHaveBeenCalled();
      expect(identityService.getToken()).toBe('mock-token');
    });

    it('should throw UserValidationError when login validation fails', async () => {
      const validationErrors = ['Invalid credentials'];
      (userValidator.validateLogin as jest.Mock).mockReturnValue(
        new ValidationResult(false, validationErrors)
      );

      await expect(identityService.login(
        'invalid',
        'wrong'
      )).rejects.toThrow(UserValidationError);
    });

    it('should throw UserOperationError when login fails', async () => {
      (userValidator.validateLogin as jest.Mock).mockReturnValue(new ValidationResult(true, []));
      (identityMediator.login as jest.Mock).mockRejectedValue(new Error('Authentication failed'));

      await expect(identityService.login(
        'test@example.com',
        TEST_CREDENTIALS.WRONG_PASSWORD
      )).rejects.toThrow(UserOperationError);
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      identityService.setToken('test-token');
      await identityService.logout();

      expect(identityMediator.logout).toHaveBeenCalled();
      expect(identityService.getToken()).toBeNull();
    });

    it('should handle logout failure gracefully', async () => {
      identityService.setToken('test-token');
      (identityMediator.logout as jest.Mock).mockRejectedValue(new Error('Logout failed'));

      await expect(identityService.logout()).rejects.toThrow(UserOperationError);
      expect(identityService.getToken()).toBeNull(); // Token should still be removed
    });
  });

  describe('updateUserProfile', () => {
    it('should update profile successfully', async () => {
      const updateData: UpdateUserDTO = {
        firstName: 'John',
        lastName: 'Doe'
      };

      const mockUser = new User(
        '1',
        'test@example.com',
        'testuser',
        new Date(),
        new Date(),
        'John',
        'Doe'
      );

      const expectedUserDTO: UserDTO = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'John',
        lastName: 'Doe',
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt
      };

      (userValidator.validateUpdateProfile as jest.Mock).mockReturnValue(new ValidationResult(true, []));
      (identityMediator.updateUserProfile as jest.Mock).mockResolvedValue(mockUser);

      const result = await identityService.updateUserProfile(updateData);

      expect(result).toEqual(expectedUserDTO);
      expect(identityMediator.updateUserProfile).toHaveBeenCalledWith(new UpdateUserProfileCommand(updateData));
      expect(userValidator.validateUpdateProfile).toHaveBeenCalledWith(updateData);
    });

    it('should throw UserValidationError when profile update validation fails', async () => {
      const updateData: UpdateUserDTO = {
        firstName: ''
      };

      (userValidator.validateUpdateProfile as jest.Mock).mockReturnValue(
        new ValidationResult(false, ['First name cannot be empty'])
      );

      await expect(identityService.updateUserProfile(updateData))
        .rejects.toThrow(UserValidationError);
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const oldPassword = TEST_CREDENTIALS.OLD_PASSWORD;
      const newPassword = TEST_CREDENTIALS.NEW_PASSWORD;

      (userValidator.validateChangePassword as jest.Mock).mockReturnValue(new ValidationResult(true, []));
      (identityMediator.changePassword as jest.Mock).mockResolvedValue(undefined);

      await identityService.changePassword(oldPassword, newPassword);

      expect(identityMediator.changePassword).toHaveBeenCalled();
      expect(userValidator.validateChangePassword).toHaveBeenCalledWith({
        oldPassword,
        newPassword
      });
    });

    it('should throw UserValidationError when password change validation fails', async () => {
      (userValidator.validateChangePassword as jest.Mock).mockReturnValue(
        new ValidationResult(false, ['New password too weak'])
      );

      await expect(identityService.changePassword(TEST_CREDENTIALS.OLD_PASSWORD, 'weak'))
        .rejects.toThrow(UserValidationError);
    });
  });

  describe('getUserProfile', () => {
    it('should get user profile successfully', async () => {
      const mockUser = new User(
        '1',
        'test@example.com',
        'testuser',
        new Date(),
        new Date()
      );

      const expectedUserDTO: UserDTO = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt
      };

      (identityMediator.getUserProfile as jest.Mock).mockResolvedValue(mockUser);

      const result = await identityService.getUserProfile();

      expect(result).toEqual(expectedUserDTO);
      expect(identityMediator.getUserProfile).toHaveBeenCalled();
    });

    it('should throw UserOperationError when profile fetch fails', async () => {
      (identityMediator.getUserProfile as jest.Mock).mockRejectedValue(new Error('Failed to fetch profile'));

      await expect(identityService.getUserProfile())
        .rejects.toThrow(UserOperationError);
    });
  });

  describe('token management', () => {
    it('should set and get token correctly', () => {
      const token = 'test-token';
      identityService.setToken(token);
      expect(identityService.getToken()).toBe(token);
    });

    it('should remove token correctly', () => {
      const token = 'test-token';
      identityService.setToken(token);
      identityService.removeToken();
      expect(identityService.getToken()).toBeNull();
    });

    it('should check authentication status correctly', () => {
      expect(identityService.isAuthenticated()).toBe(false);
      identityService.setToken('test-token');
      expect(identityService.isAuthenticated()).toBe(true);
    });
  });
}); 