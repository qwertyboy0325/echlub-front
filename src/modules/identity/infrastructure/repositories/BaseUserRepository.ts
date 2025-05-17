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
    console.log('[BaseUserRepository] 存儲 token 到 localStorage:', token);
    try {
      localStorage.setItem(this.TOKEN_KEY, token);
      // 立即檢查是否成功存儲
      const storedToken = localStorage.getItem(this.TOKEN_KEY);
      console.log('[BaseUserRepository] 驗證存儲結果:', storedToken);
      if (storedToken !== token) {
        console.warn('[BaseUserRepository] ⚠️ 存儲的 token 與期望值不一致!');
        console.log('[BaseUserRepository] 預期:', token);
        console.log('[BaseUserRepository] 實際:', storedToken);
      }
    } catch (error) {
      console.error('[BaseUserRepository] localStorage 存儲失敗:', error);
    }
  }

  getToken(): string | null {
    try {
      const token = localStorage.getItem(this.TOKEN_KEY);
      console.log('[BaseUserRepository] 從 localStorage 獲取 token:', token);
      return token;
    } catch (error) {
      console.error('[BaseUserRepository] 無法從 localStorage 獲取 token:', error);
      return null;
    }
  }

  removeToken(): void {
    try {
      localStorage.removeItem(this.TOKEN_KEY);
      console.log('[BaseUserRepository] 已從 localStorage 移除 token');
    } catch (error) {
      console.error('[BaseUserRepository] 無法從 localStorage 移除 token:', error);
    }
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
