import { injectable, inject } from 'inversify';
import { IdentityTypes } from '../../di/IdentityTypes';
import type { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User } from '../../domain/entities/User';
import { RegisterUserDTO, UpdateUserDTO, AuthResponseDTO } from '../../application/dtos/UserDTO';
import type { IEventBus } from '../../../../core/event-bus/IEventBus';
import { ApiConfig } from '../../../../core/api/ApiConfig';

@injectable()
export class UserRepository implements IUserRepository {
  private readonly API_BASE_URL = ApiConfig.baseUrl;
  private readonly TOKEN_KEY = 'auth_token';

  constructor(
    @inject(IdentityTypes.EventBus)
    _eventBus: IEventBus
  ) {}

  // Token operations
  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE_URL}${ApiConfig.auth.validateToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Token驗證錯誤:', error);
      return false;
    }
  }

  async login(email: string, password: string): Promise<AuthResponseDTO> {
    const response = await fetch(`${this.API_BASE_URL}${ApiConfig.auth.login}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: '登入失敗' }));
      throw new Error(errorData.message || '登入失敗');
    }

    const data = await response.json();
    this.setToken(data.token);
    return data;
  }

  async register(userData: RegisterUserDTO): Promise<User> {
    const response = await fetch(`${this.API_BASE_URL}${ApiConfig.auth.register}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: '註冊失敗' }));
      throw new Error(errorData.message || '註冊失敗');
    }

    const data = await response.json();
    return new User(
      data.id,
      data.email,
      data.username,
      new Date(data.createdAt),
      new Date(data.updatedAt),
      data.firstName,
      data.lastName
    );
  }

  async logout(): Promise<void> {
    const token = this.getToken();
    
    if (token) {
      try {
        // 如果後端需要處理登出，則發送請求
        await fetch(`${this.API_BASE_URL}${ApiConfig.auth.logout}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error('登出請求錯誤:', error);
        // 即使API調用失敗，依然移除token
      }
    }

    this.removeToken();
  }

  async getUserProfile(): Promise<User> {
    const token = this.getToken();
    if (!token) {
      throw new Error('未授權訪問');
    }

    const response = await fetch(`${this.API_BASE_URL}${ApiConfig.auth.profile}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: '獲取用戶資料失敗' }));
      throw new Error(errorData.message || '獲取用戶資料失敗');
    }

    const data = await response.json();
    return new User(
      data.id,
      data.email,
      data.username,
      new Date(data.createdAt),
      new Date(data.updatedAt),
      data.firstName,
      data.lastName
    );
  }

  async updateUserProfile(userData: UpdateUserDTO): Promise<User> {
    const token = this.getToken();
    if (!token) {
      throw new Error('未授權訪問');
    }

    const response = await fetch(`${this.API_BASE_URL}${ApiConfig.auth.updateProfile}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: '更新用戶資料失敗' }));
      throw new Error(errorData.message || '更新用戶資料失敗');
    }

    const data = await response.json();
    return new User(
      data.id,
      data.email,
      data.username,
      new Date(data.createdAt),
      new Date(data.updatedAt),
      data.firstName,
      data.lastName
    );
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    const token = this.getToken();
    if (!token) {
      throw new Error('未授權訪問');
    }

    const response = await fetch(`${this.API_BASE_URL}${ApiConfig.auth.changePassword}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ oldPassword, newPassword }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: '修改密碼失敗' }));
      throw new Error(errorData.message || '修改密碼失敗');
    }
  }

  async getCurrentUser(): Promise<User | null> {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      const response = await fetch(`${this.API_BASE_URL}${ApiConfig.auth.profile}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      
      return new User(
        data.id,
        data.email,
        data.username,
        new Date(data.createdAt),
        new Date(data.updatedAt),
        data.firstName,
        data.lastName
      );
    } catch (error) {
      console.error('獲取當前用戶錯誤:', error);
      return null;
    }
  }
} 