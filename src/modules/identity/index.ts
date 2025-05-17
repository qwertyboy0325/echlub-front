// 導出身份模組的所有公共接口
import { IdentityModule } from './di/IdentityModule';
import { IdentityTypes } from './di/IdentityTypes';
import { IdentityService } from './application/services/IdentityService';
import type { IUserRepository } from './domain/repositories/IUserRepository';
import { User } from './domain/entities/User';
import type { UserDTO, AuthResponseDTO } from './application/dtos/UserDTO';

// 模組導出
export { 
  IdentityModule,     // 依賴注入模組
  IdentityTypes,      // 依賴注入類型
  IdentityService,    // 主要服務接口
  User                // 用戶實體
};

// 類型導出
export type {
  IUserRepository,    // 用戶倉儲接口
  UserDTO,            // 用戶數據傳輸對象
  AuthResponseDTO     // 認證響應
}; 
