import { injectable, inject } from 'inversify';
import { IdentityTypes } from '../../di/IdentityTypes';
import type { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User } from '../../domain/entities/User';
import { RegisterUserDTO, UpdateUserDTO, AuthResponseDTO } from '../../application/dtos/UserDTO';
import type { IEventBus } from '../../../../core/event-bus/IEventBus';
import { ApiConfig } from '../../../../core/api/ApiConfig';
import { BaseUserRepository } from './BaseUserRepository';

@injectable()
export class UserRepository extends BaseUserRepository implements IUserRepository {
  private readonly API_BASE_URL = ApiConfig.baseUrl;

  constructor(
    @inject(IdentityTypes.EventBus)
    _eventBus: IEventBus
  ) {
    super(_eventBus);
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
    try {
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
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('登入失敗');
    }
  }

  async register(userData: RegisterUserDTO): Promise<User> {
    try {
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
      return this.createUserFromResponse(data);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('註冊失敗');
    }
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

    try {
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
      return this.createUserFromResponse(data);
    } catch (error) {
      this.handleApiError(error, '獲取用戶資料失敗');
    }
  }

  async updateUserProfile(userData: UpdateUserDTO): Promise<User> {
    const token = this.getToken();
    if (!token) {
      throw new Error('未授權訪問');
    }

    try {
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
      return this.createUserFromResponse(data);
    } catch (error) {
      this.handleApiError(error, '更新用戶資料失敗');
    }
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    const token = this.getToken();
    if (!token) {
      throw new Error('未授權訪問');
    }

    try {
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
    } catch (error) {
      this.handleApiError(error, '修改密碼失敗');
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
      return this.createUserFromResponse(data);
    } catch (error) {
      console.error('獲取當前用戶錯誤:', error);
      return null;
    }
  }
} 