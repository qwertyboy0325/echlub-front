import { injectable, inject } from 'inversify';
import { IdentityTypes } from '../../di/IdentityTypes';
import type { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User } from '../../domain/entities/User';
import { RegisterUserDTO, UpdateUserDTO, AuthResponseDTO } from '../../application/dtos/UserDTO';
import type { IEventBus } from '../../../../core/event-bus/IEventBus';

@injectable()
export class UserRepository implements IUserRepository {
  private readonly API_BASE_URL = '/api/auth';
  private readonly TOKEN_KEY = 'auth_token';

  constructor(
    @inject(IdentityTypes.EventBus)
    private readonly eventBus: IEventBus
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
      const response = await fetch(`${this.API_BASE_URL}/validate-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async login(email: string, password: string): Promise<AuthResponseDTO> {
    const response = await fetch(`${this.API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    return response.json();
  }

  async register(userData: RegisterUserDTO): Promise<User> {
    const response = await fetch(`${this.API_BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error('Registration failed');
    }

    return response.json();
  }

  async logout(): Promise<void> {
    try {
      const user = await this.getCurrentUser();
      if (user) {
        user.logout();
        
        // 發布 User 實體中的所有領域事件
        const events = user.getDomainEvents();
        for (const event of events) {
          await this.eventBus.publish(event);
        }
        user.clearDomainEvents();
      }
      
      this.removeToken();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Logout failed');
    }
  }

  async getUserProfile(): Promise<User> {
    const token = this.getToken();
    if (!token) {
      throw new Error('No token available');
    }

    const response = await fetch(`${this.API_BASE_URL}/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user profile');
    }

    return response.json();
  }

  async updateUserProfile(userData: UpdateUserDTO): Promise<User> {
    const response = await fetch(`${this.API_BASE_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`,
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error('Failed to update user profile');
    }

    return response.json();
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    const response = await fetch(`${this.API_BASE_URL}/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`,
      },
      body: JSON.stringify({ oldPassword, newPassword }),
    });

    if (!response.ok) {
      throw new Error('Failed to change password');
    }
  }

  async getCurrentUser(): Promise<User | null> {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      const response = await fetch(`${this.API_BASE_URL}/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      const userData = await response.json();
      
      // 檢查必要的字段是否存在
      if (!userData || !userData.id || !userData.email || !userData.username || !userData.createdAt || !userData.updatedAt) {
        return null;
      }

      return new User(
        userData.id,
        userData.email,
        userData.username,
        new Date(userData.createdAt),
        new Date(userData.updatedAt),
        userData.firstName,
        userData.lastName
      );
    } catch (error) {
      return null;
    }
  }
} 