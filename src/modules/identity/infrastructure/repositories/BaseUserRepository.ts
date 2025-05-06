import { injectable, inject } from 'inversify';
import { IdentityTypes } from '../../di/IdentityTypes';
import type { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User } from '../../domain/entities/User';
import { RegisterUserDTO, UpdateUserDTO, AuthResponseDTO } from '../../application/dtos/UserDTO';
import type { IEventBus } from '../../../../core/event-bus/IEventBus';

/**
 * 基礎用戶儲存庫類
 * 提供共用的令牌管理功能和用戶物件建立邏輯
 */
@injectable()
export abstract class BaseUserRepository implements IUserRepository {
  protected readonly TOKEN_KEY = 'auth_token';

  constructor(
    @inject(IdentityTypes.EventBus)
    protected readonly _eventBus: IEventBus
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

  /**
   * 從API回應創建用戶物件
   */
  protected createUserFromResponse(data: any): User {
    return new User(
      data.id,
      data.email,
      data.username || '',
      new Date(data.createdAt),
      new Date(data.updatedAt),
      data.firstName,
      data.lastName
    );
  }

  /**
   * 處理API錯誤回應
   */
  protected handleApiError(error: unknown, defaultMessage: string): never {
    console.error(`API 錯誤: ${defaultMessage}`, error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(defaultMessage);
  }

  // 需要子類實現的方法
  abstract validateToken(token: string): Promise<boolean>;
  abstract login(email: string, password: string): Promise<AuthResponseDTO>;
  abstract register(userData: RegisterUserDTO): Promise<User>;
  abstract logout(): Promise<void>;
  abstract getUserProfile(): Promise<User>;
  abstract updateUserProfile(userData: UpdateUserDTO): Promise<User>;
  abstract changePassword(oldPassword: string, newPassword: string): Promise<void>;
  abstract getCurrentUser(): Promise<User | null>;
} 