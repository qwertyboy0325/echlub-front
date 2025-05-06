import { Container } from 'inversify';
import { IdentityTypes } from '../../../di/IdentityTypes';
import { UserRepository } from '../../../infrastructure/repositories/UserRepository';
import { IEventBus } from '../../../../../core/event-bus/IEventBus';
import { User } from '../../../domain/entities/User';
import { AuthResponseDTO, RegisterUserDTO } from '../../../application/dtos/UserDTO';

// 使用常數定義測試用的密碼，避免硬編碼敏感信息
const TEST_CREDENTIALS = {
  PASSWORD: 'test_password_for_testing_only', // NOSONAR
  WRONG_PASSWORD: 'wrong_password_for_testing' // NOSONAR
};

describe('UserRepository', () => {
  let container: Container;
  let repository: UserRepository;
  let eventBus: IEventBus;
  let localStorageMock: { [key: string]: string };
  let getItemSpy: jest.SpyInstance;

  beforeEach(() => {
    // Clear all mocks and reset all state
    jest.clearAllMocks();
    jest.resetModules();
    
    container = new Container();
    eventBus = {
      publish: jest.fn()
    } as unknown as IEventBus;
    localStorageMock = {};

    // Mock localStorage with a fresh implementation
    const localStorageImplementation = {
      getItem: (key: string) => localStorageMock[key] || null,
      setItem: (key: string, value: string) => { localStorageMock[key] = value; },
      removeItem: (key: string) => { delete localStorageMock[key]; },
      clear: () => { localStorageMock = {}; },
      length: 0,
      key: () => '',
    };

    // Assign the implementation to global.localStorage
    Object.defineProperty(global, 'localStorage', {
      value: localStorageImplementation,
      writable: true
    });

    // Create a spy for getItem
    getItemSpy = jest.spyOn(global.localStorage, 'getItem');

    // Reset fetch mock
    global.fetch = jest.fn();

    container.bind(IdentityTypes.EventBus).toConstantValue(eventBus);
    container.bind(UserRepository).toSelf();

    repository = container.get(UserRepository);
  });

  afterEach(() => {
    // Clean up
    localStorageMock = {};
    jest.resetAllMocks();
    getItemSpy.mockRestore();
  });

  describe('token management', () => {
    it('should set and get token correctly', () => {
      const token = 'test-token';
      repository.setToken(token);
      expect(repository.getToken()).toBe(token);
    });

    it('should remove token correctly', () => {
      const token = 'test-token';
      repository.setToken(token);
      repository.removeToken();
      expect(repository.getToken()).toBeNull();
    });

    it('should validate token correctly', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ valid: true })
      });

      repository.setToken('valid-token');
      const result = await repository.validateToken('valid-token');
      expect(result).toBe(true);
    });

    it('should handle token validation failure', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ valid: false })
      });

      const result = await repository.validateToken('invalid-token');
      expect(result).toBe(false);
    });
  });

  describe('authentication', () => {
    it('should login user successfully', async () => {
      const mockResponse: AuthResponseDTO = {
        token: 'mock-token',
        user: new User(
          '1',
          'test@example.com',
          'testuser',
          new Date(),
          new Date()
        )
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await repository.login('test@example.com', TEST_CREDENTIALS.PASSWORD);

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        '/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            password: TEST_CREDENTIALS.PASSWORD
          })
        })
      );
    });

    it('should handle login failure', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false
      });

      await expect(repository.login('test@example.com', TEST_CREDENTIALS.WRONG_PASSWORD))
        .rejects.toThrow('Login failed');
    });

    it('should register user successfully', async () => {
      const mockUser = new User(
        '1',
        'test@example.com',
        'testuser',
        new Date(),
        new Date()
      );

      const registerData: RegisterUserDTO = {
        email: 'test@example.com',
        username: 'testuser',
        password: TEST_CREDENTIALS.PASSWORD
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUser)
      });

      const result = await repository.register(registerData);

      expect(result).toEqual(mockUser);
      expect(fetch).toHaveBeenCalledWith(
        '/api/auth/register',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(registerData)
        })
      );
    });

    it('should handle registration failure', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false
      });

      await expect(repository.register({
        email: 'test@example.com',
        username: 'testuser',
        password: TEST_CREDENTIALS.PASSWORD
      })).rejects.toThrow('Registration failed');
    });
  });

  describe('user operations', () => {
    describe('getCurrentUser', () => {
      it('should return null when no token is set', async () => {
        // Double check that localStorage is empty
        expect(localStorageMock).toEqual({});
        expect(global.localStorage.getItem('auth_token')).toBeNull();

        const result = await repository.getCurrentUser();
        
        expect(result).toBeNull();
        expect(global.fetch).not.toHaveBeenCalled();
        expect(getItemSpy).toHaveBeenCalledWith('auth_token');
        expect(getItemSpy).toHaveReturnedWith(null);
      });

      it('should get current user successfully', async () => {
        const mockDate = new Date('2025-05-02T03:33:38.704Z');
        const mockUser = new User(
          '1',
          'test@example.com',
          'testuser',
          mockDate,
          mockDate
        );

        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({
            id: '1',
            email: 'test@example.com',
            username: 'testuser',
            createdAt: mockDate.toISOString(),
            updatedAt: mockDate.toISOString()
          })
        });

        repository.setToken('valid-token');
        const result = await repository.getCurrentUser();

        // Compare user properties instead of the whole object
        expect(result).toBeDefined();
        expect(result?.id).toBe(mockUser.id);
        expect(result?.email).toBe(mockUser.email);
        expect(result?.username).toBe(mockUser.username);
        expect(result?.createdAt.getTime()).toBe(mockUser.createdAt.getTime());
        expect(result?.updatedAt.getTime()).toBe(mockUser.updatedAt.getTime());
      });

      it('should handle get current user failure', async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          json: () => Promise.resolve(null)
        });

        repository.setToken('valid-token');
        const result = await repository.getCurrentUser();
        expect(result).toBeNull();
      });

      it('should return null when token is expired', async () => {
        // 設置過期的 token
        repository.setToken('expired-token');
        
        // Mock API 返回 401 Unauthorized
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ message: 'Token expired' })
        });

        const result = await repository.getCurrentUser();
        expect(result).toBeNull();
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/auth/profile',
          expect.objectContaining({
            headers: expect.objectContaining({
              'Authorization': 'Bearer expired-token'
            })
          })
        );
      });

      it('should return null when network error occurs', async () => {
        repository.setToken('valid-token');
        
        // Mock 網絡錯誤
        global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

        const result = await repository.getCurrentUser();
        expect(result).toBeNull();
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/auth/profile',
          expect.objectContaining({
            headers: expect.objectContaining({
              'Authorization': 'Bearer valid-token'
            })
          })
        );
      });

      it('should return null when server returns invalid user data', async () => {
        repository.setToken('valid-token');
        
        // Mock API 返回無效的用戶數據
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({
            // 缺少必要的字段
            id: '1',
            email: 'test@example.com'
            // 缺少 username, createdAt, updatedAt
          })
        });

        const result = await repository.getCurrentUser();
        expect(result).toBeNull();
      });

      it('should return null when server returns 500 error', async () => {
        repository.setToken('valid-token');
        
        // Mock API 返回 500 錯誤
        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ message: 'Internal server error' })
        });

        const result = await repository.getCurrentUser();
        expect(result).toBeNull();
      });

      it('should handle malformed JSON response', async () => {
        repository.setToken('valid-token');
        
        // Mock API 返回格式錯誤的 JSON
        global.fetch = jest.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.reject(new Error('Invalid JSON'))
        });

        const result = await repository.getCurrentUser();
        expect(result).toBeNull();
      });
    });

    describe('logout', () => {
      it('should logout successfully', async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: true
        });

        repository.setToken('valid-token');
        await repository.logout();

        expect(fetch).toHaveBeenCalledWith(
          '/api/auth/profile',
          expect.objectContaining({
            method: 'GET',
            headers: expect.objectContaining({
              'Authorization': 'Bearer valid-token'
            })
          })
        );
        expect(repository.getToken()).toBeNull();
      });

      it('should handle logout failure', async () => {
        global.fetch = jest.fn().mockResolvedValue({
          ok: false
        });

        repository.setToken('valid-token');
        await repository.logout();
        expect(repository.getToken()).toBeNull();
      });
    });
  });
}); 